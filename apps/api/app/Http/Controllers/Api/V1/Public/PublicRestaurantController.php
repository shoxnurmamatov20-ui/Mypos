<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Public\PublicRestaurantDetailResource;
use App\Http\Resources\V1\Public\PublicRestaurantResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Marketplace listing endpoints (no auth):
 *   - GET /api/v1/public/restaurants          — paginated active list
 *   - GET /api/v1/public/restaurants/{slug}   — full detail
 *
 * Caching:
 *   - List → keyed by query params + version-bump marker so any tenant
 *     mutation invalidates every slice atomically (no key enumeration).
 *   - Detail → keyed by slug, busted by MenuCacheObserver on tenant write.
 *
 * Pagination strategy: cursor-based (default 20, max 50). The cursor is an
 * opaque, base64-encoded payload of `{ id, score }` for stable ordering.
 */
class PublicRestaurantController extends Controller
{
    private const CACHE_TTL_SECONDS = 60;
    private const DEFAULT_LIMIT = 20;
    private const MAX_LIMIT = 50;

    public function index(Request $request): JsonResponse
    {
        $params = $this->normalizeQuery($request);
        $version = (int) Cache::get('public:restaurants:version', 0);
        $cacheKey = sprintf('public:restaurants:%d:%s', $version, sha1((string) json_encode($params)));

        $payload = Cache::remember(
            $cacheKey,
            self::CACHE_TTL_SECONDS,
            fn (): array => $this->buildList($params),
        );

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=15, s-maxage=60');
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        // Negative caching is not used here: a missing slug is cheap and we
        // don't want to memoize 404s (slug may become valid mid-flight).
        $cacheKey = "public:restaurant:{$slug}";

        $payload = Cache::remember(
            $cacheKey,
            self::CACHE_TTL_SECONDS,
            function () use ($slug): ?array {
                $tenant = Tenant::query()
                    ->where('slug', $slug)
                    ->where('status', 'active')
                    ->whereNull('suspended_at')
                    ->first();

                if ($tenant === null) {
                    return null;
                }

                return [
                    'data' => PublicRestaurantDetailResource::make($tenant)
                        ->toArray(request()),
                ];
            },
        );

        if ($payload === null) {
            // Don't keep a null cached — invalidate so a freshly-activated
            // tenant becomes visible immediately.
            Cache::forget($cacheKey);
            throw new NotFoundHttpException('Restoran topilmadi');
        }

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=30, s-maxage=60');
    }

    /**
     * @param array{
     *   limit: int,
     *   cursor: string|null,
     *   cuisine: string|null,
     *   search: string|null,
     *   sort: string,
     *   lat: float|null,
     *   lng: float|null,
     *   radius_km: float|null,
     * } $params
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     */
    private function buildList(array $params): array
    {
        $query = Tenant::query()
            ->where('status', 'active')
            ->whereNull('suspended_at');

        if ($params['cuisine'] !== null) {
            $query->whereJsonContains('settings->marketplace->cuisine', $params['cuisine']);
        }

        if ($params['search'] !== null && $params['search'] !== '') {
            // ADR-0006: primary DB is PostgreSQL again, where LIKE is
            // case-sensitive — use ILIKE there; MySQL's utf8mb4 collation
            // keeps plain LIKE case-insensitive on that driver.
            $needle = $params['search'];
            $op = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function (Builder $q) use ($needle, $op): void {
                $q->where('name', $op, '%' . $needle . '%')
                    ->orWhere('slug', $op, '%' . $needle . '%');
            });
        }

        $cursorId = $this->decodeCursor($params['cursor']);
        if ($cursorId !== null) {
            $query->where('id', '>', $cursorId);
        }

        // Pull a window slightly larger than the limit so we can compute
        // distance / open-now post-query before deciding the next cursor.
        $rows = $query->orderBy('id')->limit($params['limit'] + 1)->get();

        // Optional geo filter: discard rows outside `radius_km` of (lat,lng).
        if ($params['lat'] !== null && $params['lng'] !== null) {
            $rows = $rows->map(function (Tenant $t) use ($params): Tenant {
                $location = $this->extractLocation($t);
                if ($location !== null) {
                    $t->setAttribute('_distance_km', $this->haversineKm(
                        $params['lat'],
                        $params['lng'],
                        $location['lat'],
                        $location['lng'],
                    ));
                }
                return $t;
            });

            if ($params['radius_km'] !== null) {
                $rows = $rows->filter(
                    fn (Tenant $t): bool => ($t->getAttribute('_distance_km') ?? PHP_FLOAT_MAX) <= $params['radius_km'],
                )->values();
            }
        }

        // Ordering. Default cursor walk uses `id` (deterministic). For a
        // user-facing sort, we re-sort the current window post-query.
        $rows = $this->applySort($rows, $params);

        $hasMore = $rows->count() > $params['limit'];
        $sliced = $rows->slice(0, $params['limit'])->values();

        $data = $sliced->map(
            fn (Tenant $t): array => PublicRestaurantResource::make($t)->toArray(request()),
        )->all();

        $nextCursor = null;
        if ($hasMore) {
            $last = $sliced->last();
            $nextCursor = $last !== null ? $this->encodeCursor((string) $last->id) : null;
        }

        return [
            'data' => $data,
            'meta' => [
                'count' => $sliced->count(),
                'next_cursor' => $nextCursor,
                'limit' => $params['limit'],
            ],
        ];
    }

    /**
     * @return array{
     *   limit: int,
     *   cursor: string|null,
     *   cuisine: string|null,
     *   search: string|null,
     *   sort: string,
     *   lat: float|null,
     *   lng: float|null,
     *   radius_km: float|null,
     * }
     */
    private function normalizeQuery(Request $request): array
    {
        $limit = (int) $request->query('limit', (string) self::DEFAULT_LIMIT);
        $limit = max(1, min(self::MAX_LIMIT, $limit));

        $sortRaw = (string) $request->query('sort', 'popular');
        $sort = in_array($sortRaw, ['popular', 'nearest', 'rating', 'fastest'], true)
            ? $sortRaw
            : 'popular';

        $cuisineRaw = $request->query('cuisine');
        $cuisine = is_string($cuisineRaw) && $cuisineRaw !== '' ? $cuisineRaw : null;

        $searchRaw = $request->query('search');
        $search = is_string($searchRaw) && $searchRaw !== '' ? $searchRaw : null;

        $cursorRaw = $request->query('cursor');
        $cursor = is_string($cursorRaw) && $cursorRaw !== '' ? $cursorRaw : null;

        $lat = null;
        $lng = null;
        $radius = null;
        $location = $request->query('location');
        if (is_string($location) && str_contains($location, ',')) {
            [$latRaw, $lngRaw] = explode(',', $location, 2);
            if (is_numeric($latRaw) && is_numeric($lngRaw)) {
                $lat = (float) $latRaw;
                $lng = (float) $lngRaw;
            }
        }
        $radiusRaw = $request->query('radius_km');
        if (is_numeric($radiusRaw)) {
            $radius = max(0.0, (float) $radiusRaw);
        }

        return [
            'limit' => $limit,
            'cursor' => $cursor,
            'cuisine' => $cuisine,
            'search' => $search,
            'sort' => $sort,
            'lat' => $lat,
            'lng' => $lng,
            'radius_km' => $radius,
        ];
    }

    /**
     * Apply post-query ordering. Cursor walk already orders by id; this is
     * the human-friendly second pass on the current window.
     *
     * @param  Collection<int, Tenant>  $rows
     * @param  array<string, mixed>  $params
     * @return Collection<int, Tenant>
     */
    private function applySort(Collection $rows, array $params): Collection
    {
        $marketplace = static fn (Tenant $t): array => is_array($t->settings['marketplace'] ?? null)
            ? $t->settings['marketplace']
            : [];

        return match ($params['sort']) {
            'rating' => $rows->sortByDesc(fn (Tenant $t): float => (float) ($marketplace($t)['rating'] ?? 0))
                ->values(),
            'fastest' => $rows->sortBy(fn (Tenant $t): int => (int) ($marketplace($t)['delivery_minutes'] ?? PHP_INT_MAX))
                ->values(),
            'nearest' => $rows->sortBy(fn (Tenant $t): float => (float) ($t->getAttribute('_distance_km') ?? PHP_FLOAT_MAX))
                ->values(),
            default => $rows, // popular = id-walk; later we'll wire orders count
        };
    }

    /** @return array{lat: float, lng: float}|null */
    private function extractLocation(Tenant $tenant): ?array
    {
        $settings = is_array($tenant->settings) ? $tenant->settings : [];
        $marketplace = is_array($settings['marketplace'] ?? null) ? $settings['marketplace'] : [];
        $location = $marketplace['location'] ?? null;
        if (! is_array($location) || ! isset($location['lat'], $location['lng'])) {
            return null;
        }
        if (! is_numeric($location['lat']) || ! is_numeric($location['lng'])) {
            return null;
        }
        return ['lat' => (float) $location['lat'], 'lng' => (float) $location['lng']];
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earth * $c;
    }

    private function encodeCursor(string $id): string
    {
        return rtrim(strtr(base64_encode((string) json_encode(['id' => $id])), '+/', '-_'), '=');
    }

    private function decodeCursor(?string $cursor): ?string
    {
        if ($cursor === null || $cursor === '') {
            return null;
        }
        $padded = $cursor . str_repeat('=', (4 - strlen($cursor) % 4) % 4);
        $decoded = base64_decode(strtr($padded, '-_', '+/'), true);
        if ($decoded === false) {
            return null;
        }
        $payload = json_decode($decoded, true);
        if (! is_array($payload) || ! isset($payload['id']) || ! is_string($payload['id'])) {
            return null;
        }
        return $payload['id'];
    }
}
