<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Models\TenantApp;

/**
 * Phase 3 — generate the platform-specific asset variants needed by EAS Build:
 *
 *   icon              — 1024x1024 PNG, no alpha (App Store + Play Store)
 *   adaptive icon FG  — 432x432 PNG with 25% inner padding (Android adaptive)
 *   splash            — 1242x2208 (iPhone X+) and 1080x1920 (Android)
 *
 * Today this service is a STUB: the actual ImageMagick / Intervention Image
 * resize + re-upload to MinIO is non-blocking for the first cut of "click
 * Generate App". We just echo the source URLs back so the dispatch payload
 * already has a stable shape.
 *
 * Replacing the stub:
 *   - Add `intervention/image` (Composer) — already considered Phase-3 work.
 *   - Pull source from MinIO via `Storage::disk('s3')->get($sourcePath)`.
 *   - Use `Intervention\Image\ImageManager::imagick()` for ICC-safe scaling.
 *   - Write outputs back under `tenants/{id}/apps/{platform}/{slot}-vN.png`.
 *
 * The synchronous "click → generate icons → call EAS" path is intentionally
 * decoupled from this work — Agent D2's GenerateNativeAppAction queues
 * DispatchEasBuildJob without waiting on asset processing, so a slow
 * resize cannot stall the user's HTTP request.
 */
class AppAssetService
{
    /**
     * Produce the asset URL bundle the dispatch job hands to EAS.
     *
     * Returns a stable shape: callers expect three nullable URL keys whether
     * the source pipeline ran or not.
     *
     * @return array{icon_url: string|null, adaptive_icon_url: string|null, splash_url: string|null}
     */
    public function generateIcons(TenantApp $app, ?string $sourceLogo = null): array
    {
        // Stub: pass-through. The controller / Action already validated that
        // the app row has a non-null icon_url before calling us, so the
        // dispatch payload remains valid even when we don't transform.
        return [
            'icon_url' => $app->icon_url ?? $sourceLogo,
            'adaptive_icon_url' => $app->adaptive_icon_url ?? $app->icon_url,
            'splash_url' => $app->splash_url,
        ];
    }
}
