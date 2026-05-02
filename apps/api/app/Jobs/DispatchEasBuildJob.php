<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Exceptions\EasBuildException;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Services\AppAssetService;
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
 * Long-running side of {@see \App\Domain\Tenant\Actions\GenerateNativeAppAction}.
 *
 * Reads the queued `tenant_app_builds` row, builds the EAS dispatch payload
 * (tenant identity + brand + i18n marketing copy), and POSTs it to EAS Build.
 * On success the row is flipped to `in_progress` with `eas_build_id` /
 * `log_url` populated; on failure the row goes to `errored` and the queue
 * lets us retry up to {@see self::$tries} times.
 *
 * `NotTenantAware`: we resolve the tenant explicitly via `withoutGlobalScopes()`
 * because the queue worker has no authenticated user context.
 *
 * Idempotency: re-running this job for an already-in-progress row would
 * dispatch a duplicate EAS build. We guard with a status check up-front so
 * a manual retry is safe.
 */
class DispatchEasBuildJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Up to 3 attempts with exponential back-off via the queue worker config.
     * EAS dispatch failures are usually transient (rate limit, 5xx).
     */
    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 90;

    public function __construct(public readonly string $buildId)
    {
    }

    public function handle(EasBuildClient $client, AppAssetService $assets): void
    {
        $build = TenantAppBuild::query()
            ->withoutGlobalScopes()
            ->whereKey($this->buildId)
            ->first();

        if ($build === null) {
            Log::info('DispatchEasBuildJob: build row not found', ['build_id' => $this->buildId]);
            return;
        }

        // Idempotency: avoid double-dispatching a build that another worker
        // already picked up. Anything other than `queued` is treated as
        // "someone got here first" — exit cleanly without retrying.
        if ($build->status !== BuildStatus::Queued->value) {
            Log::info('DispatchEasBuildJob: build no longer queued, skipping', [
                'build_id' => $build->id,
                'status' => $build->status,
            ]);
            return;
        }

        $app = TenantApp::query()
            ->withoutGlobalScopes()
            ->whereKey($build->tenant_app_id)
            ->first();

        if ($app === null) {
            $this->markErrored($build, 'Parent TenantApp row not found');
            return;
        }

        $tenant = Tenant::query()->whereKey($build->tenant_id)->first();
        if ($tenant === null) {
            $this->markErrored($build, 'Tenant row not found');
            return;
        }

        try {
            $build->forceFill([
                'status' => BuildStatus::InProgress->value,
                'started_at' => now(),
            ])->save();

            $config = $this->buildConfig($build, $app, $tenant, $assets);
            $easBuild = $client->dispatchBuild($config);

            $build->forceFill([
                'eas_build_id' => is_string($easBuild['id'] ?? null) ? $easBuild['id'] : null,
                'log_url' => is_string($easBuild['logsUrl'] ?? null) ? $easBuild['logsUrl'] : null,
            ])->save();

            Log::info('DispatchEasBuildJob: dispatched', [
                'build_id' => $build->id,
                'eas_build_id' => $easBuild['id'] ?? null,
                'tenant_id' => $tenant->id,
                'platform' => $build->platform,
            ]);
        } catch (EasBuildException $e) {
            $this->markErrored($build, $e->getMessage());
            // Re-throw so the queue retries (up to $tries) — transient EAS
            // 5xx / rate-limit are the most common cause.
            throw $e;
        } catch (Throwable $e) {
            $this->markErrored($build, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Compose the EAS Build dispatch payload. The shape is intentionally
     * isolated here so updates to EAS's wire format only touch one method.
     *
     * @return array<string, mixed>
     */
    private function buildConfig(
        TenantAppBuild $build,
        TenantApp $app,
        Tenant $tenant,
        AppAssetService $assets,
    ): array {
        $brand = $tenant->brand;
        $assetUrls = $assets->generateIcons($app, $app->icon_url);

        // EAS Build expects build-time env vars at TOP LEVEL under `env`,
        // not nested in metadata. Names must match `prebuild.sh` in the
        // mobile-consumer-template — the script reads EXPO_PUBLIC_ICON_URL
        // (not LOGO_URL) to download the per-tenant icon before the build.
        $env = [
            'EXPO_PUBLIC_TENANT_ID' => (string) $tenant->id,
            'EXPO_PUBLIC_TENANT_SLUG' => $tenant->slug,
            'EXPO_PUBLIC_APP_NAME' => $app->app_name,
            'EXPO_PUBLIC_BUNDLE_ID' => $app->bundle_id,
            'EXPO_PUBLIC_VERSION' => $build->version,
            'EXPO_PUBLIC_BUILD_NUMBER' => (string) $build->build_number,
            'EXPO_PUBLIC_API_URL' => rtrim((string) config('app.url'), '/') . '/api/v1',
            // Asset URLs MUST match prebuild.sh's curl statements:
            // ICON_URL, SPLASH_URL, ADAPTIVE_ICON_URL.
            'EXPO_PUBLIC_ICON_URL' => $assetUrls['icon_url'] ?? $app->icon_url,
            'EXPO_PUBLIC_SPLASH_URL' => $assetUrls['splash_url'] ?? $app->splash_url,
            'EXPO_PUBLIC_ADAPTIVE_ICON_URL' => $assetUrls['adaptive_icon_url'] ?? $app->adaptive_icon_url,
            // Brand colours read by app.config.ts via Constants.expoConfig.extra.
            'EXPO_PUBLIC_BRAND_PRIMARY' => $brand?->primary_color,
            'EXPO_PUBLIC_BRAND_ACCENT' => $brand?->accent_color,
            'EXPO_PUBLIC_ADAPTIVE_BG' => $app->adaptive_icon_bg ?? $brand?->primary_color,
        ];

        // Filter out nulls so EAS doesn't reject the request body.
        $env = array_filter($env, static fn ($v): bool => $v !== null && $v !== '');

        return [
            'platform' => $build->platform === 'universal' ? 'all' : $build->platform,
            'profile' => $build->build_profile,
            // Pin to the configured template ref so a build is reproducible
            // regardless of upstream template movement.
            'gitRef' => (string) config('eas.template_ref', 'main'),
            'gitCommitHash' => null,
            // Top-level env — EAS injects these as build-time env vars.
            'env' => $env,
            'metadata' => [
                'tenantId' => (string) $tenant->id,
                'tenantSlug' => $tenant->slug,
                'appName' => $app->app_name,
                'shortName' => $app->short_name ?? $app->app_name,
                'bundleIdentifier' => $app->bundle_id,
                'version' => $build->version,
                'buildNumber' => $build->build_number,
            ],
        ];
    }

    /**
     * Persist a terminal error state. Kept private so call sites cannot
     * accidentally bypass the timestamp + log entry.
     */
    private function markErrored(TenantAppBuild $build, string $message): void
    {
        $build->forceFill([
            'status' => BuildStatus::Errored->value,
            'error_message' => mb_substr($message, 0, 1024),
            'finished_at' => now(),
        ])->save();

        Log::error('DispatchEasBuildJob: failed', [
            'build_id' => $build->id,
            'message' => $message,
        ]);
    }
}
