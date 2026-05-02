<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Shared\Models\Currency;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Public\CurrencyResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

/**
 * Phase 4 — `GET /api/v1/public/currencies`.
 *
 * Returns the list of active ISO 4217 currencies MyPOS supports. Used by:
 *   - Marketing site signup wizard (currency dropdown)
 *   - Consumer marketplace currency selector
 *   - Generic dashboard currency dropdowns
 *
 * Cached for 1 hour because the table is essentially static — additions
 * happen on order of weeks (when we onboard a new market). The cache is
 * busted manually on the rare insert; we don't add an Observer because
 * the write surface is the migration itself.
 *
 * No auth required, no tenant context needed. Throttled at 60 req/min/IP.
 */
class PublicCurrencyController extends Controller
{
    private const CACHE_TTL_SECONDS = 3600;

    public function index(Request $request): JsonResponse
    {
        $locale = $request->getPreferredLanguage(['uz', 'ru', 'en', 'kz', 'ky', 'tg']) ?? 'en';
        $cacheKey = "public:currencies:{$locale}";

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request): array {
            $currencies = Currency::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get();

            return CurrencyResource::collection($currencies)
                ->toResponse($request)
                ->getData(true);
        });

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=600, s-maxage=3600');
    }
}
