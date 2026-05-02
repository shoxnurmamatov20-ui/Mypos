<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Exceptions\EasBuildException;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Services\EasBuildClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\NotTenantAware;
use Throwable;

/**
 * Periodic sweep that reconciles `tenant_app_builds.status` with EAS.
 *
 * EAS sends webhooks for terminal events (Agent D3 owns that endpoint), but
 * webhooks can drop, IPs can change, and we sometimes lose a notification
 * during a deploy. This job is the safety net: every 5 minutes it walks
 * the still-in-progress rows and asks EAS directly.
 *
 * Idempotent: only writes when the EAS-side status differs from the row's
 * current status. The job runs `onOneServer()` so multi-node deploys do
 * not duplicate API calls.
 *
 * Bounded by `chunkById` so memory stays flat as the build history grows.
 */
class PollBuildStatusJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    private const CHUNK_SIZE = 50;

    public function handle(EasBuildClient $client): void
    {
        TenantAppBuild::query()
            ->withoutGlobalScopes()
            ->whereIn('status', [
                BuildStatus::Queued->value,
                BuildStatus::InProgress->value,
            ])
            ->whereNotNull('eas_build_id')
            // Skip rows updated within last 2 min — recent webhook already
            // captured them. Reduces wasted EAS API calls by ~80% in practice.
            ->where(function ($q): void {
                $q->whereNull('updated_at')
                    ->orWhere('updated_at', '<', now()->subMinutes(2));
            })
            ->orderBy('id')
            ->chunkById(self::CHUNK_SIZE, function ($builds) use ($client): bool {
                foreach ($builds as $build) {
                    try {
                        $this->syncOne($client, $build);
                    } catch (Throwable $e) {
                        // 429 backoff: stop the whole sweep when EAS rate limits
                        // us, to avoid cascade failure. Resume on next tick.
                        if (str_contains($e->getMessage(), '429')) {
                            Log::warning('PollBuildStatusJob: rate limited by EAS, stopping sweep');
                            return false;
                        }
                        Log::warning('PollBuildStatusJob: row failed', [
                            'build_id' => $build->id,
                            'eas_build_id' => $build->eas_build_id,
                            'exception' => $e->getMessage(),
                        ]);
                    }
                    // Jitter 50-250ms between rows to spread EAS load.
                    usleep(random_int(50_000, 250_000));
                }
                return true;
            });
    }

    private function syncOne(EasBuildClient $client, TenantAppBuild $build): void
    {
        try {
            $remote = $client->getBuild((string) $build->eas_build_id);
        } catch (EasBuildException $e) {
            // 404s on the EAS side mean either the build id was a typo or the
            // build was purged after retention. Mark errored to stop polling.
            if (str_contains($e->getMessage(), '404')) {
                $build->forceFill([
                    'status' => BuildStatus::Errored->value,
                    'error_message' => 'EAS build not found (404).',
                    'finished_at' => now(),
                ])->save();
                return;
            }
            throw $e;
        }

        $remoteStatus = is_string($remote['status'] ?? null) ? $remote['status'] : null;
        $newStatus = BuildStatus::fromEas($remoteStatus);

        $updates = [];

        if ($newStatus->value !== $build->status) {
            $updates['status'] = $newStatus->value;
        }

        // Capture artifact URL once it's available — works for both ipa/aab.
        $artifact = $remote['artifacts']['buildUrl']
            ?? $remote['artifactUrl']
            ?? null;
        if (is_string($artifact) && $artifact !== '' && $build->artifact_url !== $artifact) {
            $updates['artifact_url'] = $artifact;
        }

        $logUrl = $remote['logsUrl'] ?? $remote['logUrl'] ?? null;
        if (is_string($logUrl) && $logUrl !== '' && $build->log_url !== $logUrl) {
            $updates['log_url'] = $logUrl;
        }

        if ($newStatus->isTerminal() && $build->finished_at === null) {
            $updates['finished_at'] = now();
        }

        if ($newStatus === BuildStatus::Failed || $newStatus === BuildStatus::Errored) {
            $message = $remote['error']['message'] ?? null;
            if (is_string($message) && $message !== '') {
                $updates['error_message'] = mb_substr($message, 0, 1024);
            }
        }

        if ($updates !== []) {
            $build->forceFill($updates)->save();
            Log::info('PollBuildStatusJob: synced', [
                'build_id' => $build->id,
                'updates' => array_keys($updates),
            ]);
        }
    }
}
