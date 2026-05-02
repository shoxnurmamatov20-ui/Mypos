<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Tenant\Enums\SubmissionStatus;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Services\AppStoreConnectClient;
use App\Domain\Tenant\Services\GooglePlayClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\NotTenantAware;
use Throwable;

/**
 * Hourly sweep that progresses build submission_status from
 * `submitted` → `in_review` → `approved | rejected`.
 *
 * Apple/Google don't push notifications when reviews change state — we have
 * to poll. Hourly is a reasonable cadence (Apple median review SLA is
 * 24-48h; Google internal-testing rollouts are minutes-to-hours).
 *
 * Scope: only builds in non-terminal submission states younger than the
 * configured `max_age_days` cutoff. Older builds are abandoned to avoid
 * unbounded polling — the dashboard shows the last-known state and offers
 * a manual "Re-check" button (TODO at admin endpoints).
 *
 * Run via `routes/console.php`:
 *
 *   Schedule::job(new PollSubmissionStatusJob())
 *       ->hourly()
 *       ->onOneServer()
 *       ->withoutOverlapping(20)
 *       ->name('store:poll-submissions');
 */
class PollSubmissionStatusJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 600;

    private const CHUNK_SIZE = 50;

    public function handle(
        AppStoreConnectClient $apple,
        GooglePlayClient $google,
    ): void {
        $cutoff = now()->subDays((int) config('eas.submission_poll.max_age_days', 14));

        TenantAppBuild::query()
            ->withoutGlobalScopes()
            ->whereIn('submission_status', [
                SubmissionStatus::Submitted->value,
                SubmissionStatus::InReview->value,
            ])
            ->where('submitted_at', '>=', $cutoff)
            ->orderBy('id')
            ->chunkById(self::CHUNK_SIZE, function ($builds) use ($apple, $google): void {
                foreach ($builds as $build) {
                    try {
                        $this->pollOne($build, $apple, $google);
                    } catch (Throwable $e) {
                        Log::warning('PollSubmissionStatusJob: row failed', [
                            'build_id' => $build->id,
                            'exception' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }

    private function pollOne(
        TenantAppBuild $build,
        AppStoreConnectClient $apple,
        GooglePlayClient $google,
    ): void {
        $app = TenantApp::query()
            ->withoutGlobalScopes()
            ->whereKey($build->tenant_app_id)
            ->first();

        if ($app === null) {
            return;
        }

        // Tenant-owned builds aren't ours to poll — the owner submits on
        // their own developer account, and the review state is invisible to
        // our service-account credentials.
        if ($app->build_account === 'tenant') {
            return;
        }

        match ($build->platform) {
            'ios' => $this->pollApple($build, $app, $apple),
            'android' => $this->pollGoogle($build, $app, $google),
            default => null,
        };
    }

    private function pollApple(TenantAppBuild $build, TenantApp $app, AppStoreConnectClient $apple): void
    {
        if (empty($app->apple_app_id)) {
            return;
        }

        $result = $apple->getReviewStatus((int) $app->apple_app_id);
        $newStatus = $this->mapAppleState((string) ($result['state'] ?? ''));

        $this->applyTransition($build, $app, $newStatus);
    }

    private function pollGoogle(TenantAppBuild $build, TenantApp $app, GooglePlayClient $google): void
    {
        $packageName = (string) ($app->google_package_name ?? '');
        if ($packageName === '') {
            return;
        }

        $result = $google->getReviewStatus($packageName);
        $newStatus = $this->mapGoogleState((string) ($result['state'] ?? ''));

        $this->applyTransition($build, $app, $newStatus);
    }

    /**
     * Map Apple's appStoreState onto our SubmissionStatus enum.
     *
     * Apple states reference:
     * https://developer.apple.com/documentation/appstoreconnectapi/appstoreversionstate
     */
    private function mapAppleState(string $appleState): ?SubmissionStatus
    {
        return match (strtoupper($appleState)) {
            'WAITING_FOR_REVIEW' => SubmissionStatus::Submitted,
            'IN_REVIEW' => SubmissionStatus::InReview,
            'PENDING_DEVELOPER_RELEASE',
            'READY_FOR_SALE',
            'PROCESSING_FOR_APP_STORE' => SubmissionStatus::Approved,
            'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY' => SubmissionStatus::Rejected,
            default => null,
        };
    }

    /**
     * Map Google Play release status onto our enum.
     *
     * Play release.status values: completed, inProgress, halted, draft.
     */
    private function mapGoogleState(string $googleState): ?SubmissionStatus
    {
        return match (strtolower($googleState)) {
            'inprogress', 'in_progress' => SubmissionStatus::InReview,
            'completed' => SubmissionStatus::Approved,
            'halted', 'rejected' => SubmissionStatus::Rejected,
            'draft' => SubmissionStatus::Submitted,
            default => null,
        };
    }

    /**
     * Persist the new submission status if it represents progress. Approve /
     * reject are terminal and propagate `approved_at` to the parent app.
     */
    private function applyTransition(
        TenantAppBuild $build,
        TenantApp $app,
        ?SubmissionStatus $next,
    ): void {
        if ($next === null || $next->value === $build->submission_status) {
            return;
        }

        $build->forceFill([
            'submission_status' => $next->value,
        ])->save();

        if ($next === SubmissionStatus::Approved) {
            $app->forceFill([
                'approved_at' => $app->approved_at ?? now(),
                'status' => 'live',
            ])->save();
        }

        Log::info('PollSubmissionStatusJob: status updated', [
            'build_id' => $build->id,
            'platform' => $build->platform,
            'submission_status' => $next->value,
        ]);
    }
}
