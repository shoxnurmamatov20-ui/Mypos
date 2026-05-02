<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Tenant\Enums\BuildStatus;
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
 * Post-build store-submission orchestrator.
 *
 * Triggered by EasBuildWebhookController when a build reaches `finished`
 * status. Decides whether MyPOS submits on the tenant's behalf (default,
 * `build_account=mypos`) or merely notifies the tenant to submit themselves
 * (`build_account=tenant` — Enterprise-tier restaurants who bring their own
 * Apple/Google accounts).
 *
 * Idempotent: re-running the job on a build whose submission_status is
 * already non-pending is a no-op so duplicate webhook deliveries do not
 * resubmit.
 *
 * NotTenantAware: webhook context has no tenant; we hydrate the row with
 * `withoutGlobalScopes()` and let RLS-bypassed writes happen via forceFill.
 *
 * Failure handling:
 *   - 3 retries with exponential back-off. Apple/Google quotas are generous
 *     enough that 3 quick retries won't trip them.
 *   - On terminal failure, sets submission_status back to 'pending' and
 *     records the error on `reviewer_notes` so the dashboard shows the
 *     actual cause without leaking it back to the (multi-tenant) request log.
 */
class SubmitToStoreJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;
    public int $timeout = 300;

    public function __construct(
        public readonly string $buildId,
    ) {
    }

    public function handle(
        AppStoreConnectClient $apple,
        GooglePlayClient $google,
    ): void {
        $build = TenantAppBuild::query()
            ->withoutGlobalScopes()
            ->whereKey($this->buildId)
            ->first();

        if ($build === null) {
            Log::info('SubmitToStoreJob: build not found, skipping', ['build_id' => $this->buildId]);
            return;
        }

        // Idempotency guard — only act on freshly-finished builds.
        if ($build->status !== BuildStatus::Finished->value) {
            Log::info('SubmitToStoreJob: build is not in finished state, skipping', [
                'build_id' => $build->id,
                'status' => $build->status,
            ]);
            return;
        }
        if ($build->submission_status !== SubmissionStatus::Pending->value) {
            Log::info('SubmitToStoreJob: submission already processed, skipping', [
                'build_id' => $build->id,
                'submission_status' => $build->submission_status,
            ]);
            return;
        }

        $app = TenantApp::query()
            ->withoutGlobalScopes()
            ->whereKey($build->tenant_app_id)
            ->first();

        if ($app === null) {
            Log::warning('SubmitToStoreJob: parent tenant_app missing', ['build_id' => $build->id]);
            return;
        }

        // Branch on ownership. Enterprise tenants get a "you must submit on
        // your own developer account" notification; everyone else gets the
        // submission performed for them.
        if ($app->build_account === 'tenant') {
            $this->markPendingOwner($build);
            return;
        }

        match ($build->platform) {
            'ios' => $this->submitToApple($build, $app, $apple),
            'android' => $this->submitToGoogle($build, $app, $google),
            default => $this->markUnsupportedPlatform($build),
        };
    }

    private function submitToApple(TenantAppBuild $build, TenantApp $app, AppStoreConnectClient $apple): void
    {
        if (empty($app->apple_app_id)) {
            // First-time publish needs createApp() first — that's owned by
            // GenerateNativeAppAction (Agent D2). Defer back to pending so
            // the next manual retry can pick it up.
            Log::warning('SubmitToStoreJob: apple_app_id missing, cannot submit', [
                'build_id' => $build->id,
                'tenant_app_id' => $app->id,
            ]);
            $build->forceFill([
                'reviewer_notes' => 'Apple App Store record not yet created — run createApp() first.',
            ])->save();
            return;
        }

        try {
            $result = $apple->submitForReview(
                appId: (int) $app->apple_app_id,
                artifactUrl: (string) $build->artifact_url,
            );
        } catch (Throwable $e) {
            Log::error('SubmitToStoreJob: Apple submission failed', [
                'build_id' => $build->id,
                'exception' => $e->getMessage(),
            ]);
            $build->forceFill([
                'reviewer_notes' => 'Apple submission failed: ' . $e->getMessage(),
            ])->save();
            throw $e; // let the queue retry
        }

        $build->forceFill([
            'submission_status' => SubmissionStatus::Submitted->value,
            'submitted_at' => now(),
            'reviewer_notes' => null,
        ])->save();

        // TenantApp denormalized timestamp — gives the dashboard a quick
        // "last submission attempted" datapoint without joining builds.
        $app->forceFill([
            'submitted_at' => now(),
        ])->save();

        Log::info('SubmitToStoreJob: Apple submission queued', [
            'build_id' => $build->id,
            'submission_id' => $result['submission_id'] ?? null,
        ]);
    }

    private function submitToGoogle(TenantAppBuild $build, TenantApp $app, GooglePlayClient $google): void
    {
        $packageName = (string) ($app->google_package_name ?? $app->bundle_id ?? '');
        if ($packageName === '') {
            Log::warning('SubmitToStoreJob: google_package_name missing', [
                'build_id' => $build->id,
                'tenant_app_id' => $app->id,
            ]);
            $build->forceFill([
                'reviewer_notes' => 'Play Store package name missing — configure tenant_apps.google_package_name first.',
            ])->save();
            return;
        }

        try {
            $versionCode = $google->uploadAab(
                packageName: $packageName,
                aabPath: (string) $build->artifact_url,
                track: (string) config('services.google_play.default_track', 'internal'),
            );
        } catch (Throwable $e) {
            Log::error('SubmitToStoreJob: Google submission failed', [
                'build_id' => $build->id,
                'exception' => $e->getMessage(),
            ]);
            $build->forceFill([
                'reviewer_notes' => 'Google submission failed: ' . $e->getMessage(),
            ])->save();
            throw $e;
        }

        $build->forceFill([
            'submission_status' => SubmissionStatus::Submitted->value,
            'submitted_at' => now(),
            'qr_code_url' => $google->internalTestingOptInUrl($packageName),
            'reviewer_notes' => null,
        ])->save();

        $app->forceFill([
            'submitted_at' => now(),
        ])->save();

        Log::info('SubmitToStoreJob: Google submission queued', [
            'build_id' => $build->id,
            'package' => $packageName,
            'version_code' => $versionCode,
        ]);
    }

    /**
     * Enterprise / build_account=tenant case: we can't submit on the tenant's
     * developer account, so we simply flag the build as awaiting the owner's
     * action and (TODO) email them the artifact link.
     */
    private function markPendingOwner(TenantAppBuild $build): void
    {
        $build->forceFill([
            // Reuse Pending — there's no dedicated "pending_owner" enum case
            // (would balloon SubmissionStatus surface). The reviewer_notes
            // field carries the disambiguation for the UI.
            'submission_status' => SubmissionStatus::Pending->value,
            'reviewer_notes' => 'Awaiting tenant submission on their own developer account. Artifact: ' . (string) $build->artifact_url,
        ])->save();

        Log::info('SubmitToStoreJob: tenant-owned build, owner action required', [
            'build_id' => $build->id,
        ]);

        // TODO(D3-prod): dispatch NotifyTenantOwnerJob with download link +
        // submission instructions (i18n strings: native_app.submission.owner.*).
    }

    private function markUnsupportedPlatform(TenantAppBuild $build): void
    {
        Log::warning('SubmitToStoreJob: unsupported platform', [
            'build_id' => $build->id,
            'platform' => $build->platform,
        ]);
        $build->forceFill([
            'reviewer_notes' => 'Unsupported platform: ' . $build->platform,
        ])->save();
    }
}
