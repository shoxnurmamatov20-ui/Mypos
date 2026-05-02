<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Actions;

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\AppStatus;
use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Jobs\DispatchEasBuildJob;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Trigger an EAS Build for a tenant's white-label native app.
 *
 * Public surface: `POST /api/v1/admin/apps/{id}/build` (see AppController).
 * The HTTP request returns *immediately* once the queued
 * {@see TenantAppBuild} row has been created — actual EAS dispatch happens
 * asynchronously in {@see DispatchEasBuildJob}.
 *
 * Pre-flight (in priority order):
 *
 *   1. Tier check — only Enterprise+ tenants can ship native apps. Failing
 *      this returns 403 (caller should surface "upgrade your plan").
 *   2. Configuration check — bundle id and icon must be set; everything else
 *      can be defaulted by the template. 422 with a field-level reason.
 *   3. Concurrency check — refuse to queue a second build if one is already
 *      `queued`/`in_progress` for the same (app, platform). 422.
 *
 * Versioning rules:
 *   - `current_version` is bumped patch-by-default; the caller may override
 *     by passing `version` to the FormRequest layer (not yet exposed — the
 *     simple "increment patch" rule is sufficient for the v1 dashboard).
 *   - `current_build_number` is monotonically incremented across all
 *     platforms — Apple and Google both require strict monotonic build IDs
 *     so we share the counter to avoid edge cases when bumping one stack.
 */
final class GenerateNativeAppAction
{
    /**
     * @param  AppPlatform|string  $platform  Either an enum or its string value
     *                                        (controllers may pass the request input directly).
     */
    public function __invoke(TenantApp $app, AppPlatform|string $platform = AppPlatform::Universal): TenantAppBuild
    {
        $platformEnum = $platform instanceof AppPlatform
            ? $platform
            : (AppPlatform::tryFrom($platform) ?? AppPlatform::Universal);

        $this->ensureBuildable($app);
        $this->ensureNoConcurrentBuild($app, $platformEnum);

        return DB::transaction(function () use ($app, $platformEnum): TenantAppBuild {
            $nextVersion = $this->bumpVersion($app->current_version ?? '0.0.0');
            $nextBuildNumber = ((int) $app->current_build_number) + 1;

            $build = new TenantAppBuild();
            $build->forceFill([
                'tenant_id' => $app->tenant_id,
                'tenant_app_id' => $app->id,
                'platform' => $platformEnum->value,
                'status' => BuildStatus::Queued->value,
                'version' => $nextVersion,
                'build_number' => $nextBuildNumber,
                'build_profile' => 'production',
            ])->save();

            // Mirror the next-version pointer onto the parent so list views
            // can show the in-flight version without a join. The actual
            // store-listed version only flips on `approved_at`.
            $app->forceFill([
                'current_version' => $nextVersion,
                'current_build_number' => $nextBuildNumber,
                'latest_build_id' => $build->id,
                'status' => AppStatus::Building->value,
            ])->save();

            // Dispatch the long-running EAS call to the queue. afterCommit()
            // ensures the queued worker can see the freshly-created row even
            // when the surrounding transaction is rolled back by a later error.
            DispatchEasBuildJob::dispatch($build->id)->afterCommit();

            return $build;
        });
    }

    /**
     * Bump a SemVer "x.y.z" string by one patch. Defensive against partial
     * versions ("1", "1.2") and non-numeric input — we treat anything malformed
     * as the next safe rollback "0.0.1" rather than failing the build.
     */
    public function bumpVersion(string $version): string
    {
        $parts = explode('.', trim($version));
        $major = isset($parts[0]) && ctype_digit($parts[0]) ? (int) $parts[0] : 0;
        $minor = isset($parts[1]) && ctype_digit($parts[1]) ? (int) $parts[1] : 0;
        $patch = isset($parts[2]) && ctype_digit($parts[2]) ? (int) $parts[2] : 0;
        $patch++;
        return sprintf('%d.%d.%d', $major, $minor, $patch);
    }

    private function ensureBuildable(TenantApp $app): void
    {
        $tenant = $app->tenant;
        if ($tenant === null || ! $tenant->canUseNativeApp()) {
            throw new AccessDeniedHttpException(
                __('Tarif rejasi native app yaratishni qo\'llab-quvvatlamaydi'),
            );
        }

        if ($app->icon_url === null || $app->icon_url === '') {
            throw new UnprocessableEntityHttpException(
                __('Ilova ikonkasi (icon_url) talab qilinadi'),
            );
        }

        if ($app->bundle_id === null || $app->bundle_id === '') {
            throw new UnprocessableEntityHttpException(
                __('Bundle ID talab qilinadi'),
            );
        }

        if ($app->app_name === null || $app->app_name === '') {
            throw new UnprocessableEntityHttpException(
                __('Ilova nomi (app_name) talab qilinadi'),
            );
        }
    }

    private function ensureNoConcurrentBuild(TenantApp $app, AppPlatform $platform): void
    {
        $hasInflight = TenantAppBuild::query()
            ->where('tenant_app_id', $app->id)
            ->where('platform', $platform->value)
            ->whereIn('status', [
                BuildStatus::Queued->value,
                BuildStatus::InProgress->value,
            ])
            ->exists();

        if ($hasInflight) {
            throw new UnprocessableEntityHttpException(
                __('Avvalgi build hali tugamadi — kuting yoki uni bekor qiling'),
            );
        }
    }
}
