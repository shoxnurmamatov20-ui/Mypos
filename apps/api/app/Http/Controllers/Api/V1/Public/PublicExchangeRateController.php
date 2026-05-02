<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Shared\Services\FxRateService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Public\GetExchangeRateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use RuntimeException;

/**
 * Phase 4 — `GET /api/v1/public/exchange-rates?from=USD&to=UZS&date=YYYY-MM-DD`.
 *
 * Returns the resolved rate for a single (from, to, date) triple. Used by:
 *   - Consumer marketplace "show me USD prices" toggle
 *   - Reporting dashboards (read at render time, NOT cached client-side)
 *   - Receipt generators that need a stable historical rate
 *
 * The rate comes from {@see FxRateService} — direct lookup → inverse →
 * USD-pivot triangulation, in that order. When no rate is available we
 * return 404 with a descriptive message; callers must decide how to
 * handle it (most fall back to display-only "FX unavailable").
 *
 * No auth required. Tight throttle (60 req/min/IP) because abusers might
 * try to use this as a free FX feed.
 */
class PublicExchangeRateController extends Controller
{
    public function show(GetExchangeRateRequest $request, FxRateService $fx): JsonResponse
    {
        /** @var array{from: string, to: string, date?: string} $valid */
        $valid = $request->validated();

        $from = strtoupper($valid['from']);
        $to = strtoupper($valid['to']);
        $date = isset($valid['date']) ? Carbon::createFromFormat('Y-m-d', $valid['date']) : Carbon::today();

        if ($date === false) {
            $date = Carbon::today();
        }

        try {
            $rate = $fx->rate($from, $to, $date);
        } catch (RuntimeException $e) {
            // No rate available on or before the requested date for this
            // pair — could be a brand-new currency or a backfill gap.
            // Return 404 so clients can degrade gracefully (we deliberately
            // do NOT silently fall back to 1.0 — that would corrupt totals).
            return response()->json([
                'data' => null,
                'errors' => [
                    'code' => 'fx_rate_unavailable',
                    'message' => $e->getMessage(),
                ],
            ], 404);
        }

        return response()->json([
            'data' => [
                'from' => $from,
                'to' => $to,
                'rate' => $rate,
                'rate_date' => $date->toDateString(),
            ],
            'meta' => [
                'note' => 'Rate is "1 unit of from = N units of to". May be derived via inverse or USD-pivot when no direct rate is published.',
            ],
        ])->header('Cache-Control', 'public, max-age=300');
    }
}
