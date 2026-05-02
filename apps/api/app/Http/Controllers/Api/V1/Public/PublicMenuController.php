<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Menu\MenuCategoryResource;
use App\Http\Resources\V1\Menu\MenuItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Public (unauthenticated) menu endpoint — used by QR-scan PWA *and* by the
 * consumer marketplace web/mobile clients.
 *
 * Caching:
 *   - Payload cached in Redis for 60s under `public:menu:{tenant_id}`
 *   - ETag stored alongside under `public:menu:etag:{tenant_id}` (same TTL)
 *   - Cache invalidated on MenuItem / MenuCategory writes by MenuCacheObserver
 *   - Browsers/CDNs see `Cache-Control: public, max-age=30, s-maxage=60`
 *   - When the client returns a matching `If-None-Match`, we short-circuit to
 *     HTTP 304 with no body — saves the JSON encode + bytes on the wire.
 *
 * Strictly filters by tenant slug; no cross-tenant leakage.
 */
class PublicMenuController extends Controller
{
    private const CACHE_TTL_SECONDS = 60;
    private const BROWSER_MAX_AGE = 30;

    public function show(Request $request, string $slug): JsonResponse
    {
        $tenant = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->whereNull('suspended_at')
            ->first();

        if ($tenant === null) {
            throw new NotFoundHttpException("Restoran topilmadi");
        }

        $cacheKey = "public:menu:{$tenant->id}";
        $etagKey = "public:menu:etag:{$tenant->id}";

        // Resolve cached payload (build on miss).
        $payload = Cache::remember(
            $cacheKey,
            self::CACHE_TTL_SECONDS,
            fn (): array => $this->buildPayload($tenant, $request),
        );

        // Compute ETag once per cache cycle. Stored separately so we can
        // short-circuit 304 without rebuilding/re-encoding the body.
        $etag = Cache::remember(
            $etagKey,
            self::CACHE_TTL_SECONDS,
            fn (): string => $this->computeEtag($payload),
        );

        $ifNoneMatch = trim($request->headers->get('If-None-Match', ''));
        if ($ifNoneMatch !== '' && $this->etagMatches($ifNoneMatch, $etag)) {
            return response()->json(null, 304)
                ->header('ETag', '"' . $etag . '"')
                ->header('Cache-Control', sprintf(
                    'public, max-age=%d, s-maxage=%d',
                    self::BROWSER_MAX_AGE,
                    self::CACHE_TTL_SECONDS,
                ));
        }

        return response()->json($payload)
            ->header('ETag', '"' . $etag . '"')
            ->header('Cache-Control', sprintf(
                'public, max-age=%d, s-maxage=%d',
                self::BROWSER_MAX_AGE,
                self::CACHE_TTL_SECONDS,
            ));
    }

    /** @return array<string, mixed> */
    private function buildPayload(Tenant $tenant, Request $request): array
    {
        // Bypass the BelongsToTenant global scope — public context has no
        // authenticated user. We re-add the explicit tenant_id filter below.
        $categories = MenuCategory::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $items = MenuItem::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return [
            'data' => [
                'tenant' => [
                    'id' => $tenant->id,
                    'slug' => $tenant->slug,
                    'name' => $tenant->name,
                    'logo_url' => $tenant->logo_url,
                    'default_locale' => $tenant->default_locale,
                    'default_currency' => $tenant->default_currency,
                    'timezone' => $tenant->timezone,
                ],
                'categories' => MenuCategoryResource::collection($categories)->toArray($request),
                'items' => MenuItemResource::collection($items)->toArray($request),
            ],
        ];
    }

    /** @param array<string, mixed> $payload */
    private function computeEtag(array $payload): string
    {
        $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE);
        return $encoded === false ? (string) crc32(serialize($payload)) : substr(sha1($encoded), 0, 16);
    }

    /**
     * Check whether the client-sent If-None-Match contains our ETag.
     * Tolerates weak validators (`W/"x"`) and lists (`"a", "b"`).
     */
    private function etagMatches(string $header, string $etag): bool
    {
        $candidates = preg_split('/\s*,\s*/', $header) ?: [];
        $needle = '"' . $etag . '"';
        $weak = 'W/"' . $etag . '"';

        foreach ($candidates as $candidate) {
            $candidate = trim($candidate);
            if ($candidate === $needle || $candidate === $weak || $candidate === '*') {
                return true;
            }
        }

        return false;
    }
}
