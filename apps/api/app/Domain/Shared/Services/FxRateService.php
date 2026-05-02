<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services;

use App\Domain\Shared\Models\ExchangeRate;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

/**
 * Phase 4 — FX rate resolution + currency conversion.
 *
 * The application layer's only entry point into the `exchange_rates` table.
 * Caches reads for 6 hours under the key `fx:{from}:{to}:{YYYY-MM-DD}` —
 * the daily sync job ({@see \App\Jobs\SyncFxRatesJob}) busts the cache for
 * its target date when it inserts, so fresh rates propagate within minutes
 * even though the TTL is long.
 *
 * Resolution algorithm (in order):
 *   1. If from == to, return 1.0 trivially.
 *   2. Look for the most recent rate row on or before $date for (from, to).
 *   3. Look for the inverse pair (to, from) and return 1/rate.
 *   4. Look for a USD-pivot triangulation: from→USD * USD→to.
 *   5. Throw — caller must decide whether to fallback to a stale rate or
 *      surface the error to the operator.
 *
 * Why "on or before $date" instead of strict-equal: weekends and holidays.
 * CBU / NBP / NBKR don't publish on Sat/Sun, but our tenants still take
 * orders. We pin to the most recent business-day rate so receipts remain
 * stable.
 *
 * Conversion is intentionally one-way only — convert(Money, $to) returns a
 * NEW Money. There is no in-place mutation because Money is immutable.
 */
class FxRateService
{
    private const CACHE_TTL_HOURS = 6;
    private const PIVOT_CURRENCY = 'USD';

    /**
     * Resolve "1 unit of $from = N units of $to" on or before $date.
     *
     * @throws RuntimeException when no rate (direct, inverse, or pivot) is
     *                          available — callers must handle this; we
     *                          DELIBERATELY do not return null/1.0 silently
     *                          because that would corrupt receipts.
     */
    public function rate(string $from, string $to, ?Carbon $date = null): float
    {
        $from = strtoupper($from);
        $to = strtoupper($to);

        if ($from === $to) {
            return 1.0;
        }

        $date ??= Carbon::today();
        $cacheKey = "fx:{$from}:{$to}:{$date->toDateString()}";

        return Cache::remember(
            $cacheKey,
            now()->addHours(self::CACHE_TTL_HOURS),
            fn (): float => $this->resolveRate($from, $to, $date),
        );
    }

    /**
     * Convert a Money into another currency at the rate effective on $date
     * (default: today). Result is rounded HALF_EVEN to the integer minor
     * unit — the same rule {@see Money::multiply()} uses, for consistency.
     */
    public function convert(Money $money, string $toCurrency, ?Carbon $date = null): Money
    {
        $toCurrency = strtoupper($toCurrency);
        if ($money->currency === $toCurrency) {
            return $money;
        }

        $rate = $this->rate($money->currency, $toCurrency, $date);

        // Account for differing decimal scales: 100 USD cents @ 12,805 means
        // the multiplied value is in "minor of $to per minor of $from", but
        // since BOTH sides multiply through the SAME rate (rate is major-to-
        // major), we have to scale by the decimal-place delta.
        $fromDecimals = Money::decimalsFor($money->currency);
        $toDecimals = Money::decimalsFor($toCurrency);
        $scale = 10 ** ($toDecimals - $fromDecimals);

        $converted = (int) round(
            $money->minor * $rate * $scale,
            0,
            PHP_ROUND_HALF_EVEN
        );

        return Money::fromMinor(max(0, $converted), $toCurrency);
    }

    /**
     * Programmatically clear the cache for a (from, to, date) triple. Called
     * by SyncFxRatesJob right after an insert so a freshly-fetched rate is
     * visible immediately on the next read instead of waiting out the 6-hour
     * TTL. Public so admin tooling can invalidate after a manual override.
     */
    public function forget(string $from, string $to, Carbon $date): void
    {
        Cache::forget("fx:" . strtoupper($from) . ":" . strtoupper($to) . ":{$date->toDateString()}");
    }

    // -----------------------------------------------------------------
    // Internals
    // -----------------------------------------------------------------

    /** @throws RuntimeException */
    private function resolveRate(string $from, string $to, Carbon $date): float
    {
        // 1. Direct lookup.
        $direct = $this->lookup($from, $to, $date);
        if ($direct !== null) {
            return $direct;
        }

        // 2. Inverse lookup (`to → from` exists, take the reciprocal).
        $inverse = $this->lookup($to, $from, $date);
        if ($inverse !== null && $inverse > 0.0) {
            return 1.0 / $inverse;
        }

        // 3. USD-pivot triangulation. KZT→TJS is rare; KZT→USD and USD→TJS
        //    are both common, so we triangulate. Skipped if either side IS
        //    USD already (we'd just hit the direct path again).
        if ($from !== self::PIVOT_CURRENCY && $to !== self::PIVOT_CURRENCY) {
            $fromToPivot = $this->resolveOneStep($from, self::PIVOT_CURRENCY, $date);
            $pivotToDest = $this->resolveOneStep(self::PIVOT_CURRENCY, $to, $date);
            if ($fromToPivot !== null && $pivotToDest !== null) {
                return $fromToPivot * $pivotToDest;
            }
        }

        throw new RuntimeException(
            "No FX rate available for {$from} → {$to} on or before {$date->toDateString()}"
        );
    }

    /**
     * Resolve a single-hop rate using direct OR inverse lookup, but no
     * triangulation. Helper for the pivot path so we don't recurse infinitely.
     */
    private function resolveOneStep(string $from, string $to, Carbon $date): ?float
    {
        if ($from === $to) {
            return 1.0;
        }
        $direct = $this->lookup($from, $to, $date);
        if ($direct !== null) {
            return $direct;
        }
        $inverse = $this->lookup($to, $from, $date);
        if ($inverse !== null && $inverse > 0.0) {
            return 1.0 / $inverse;
        }
        return null;
    }

    /**
     * Most-recent rate row at or before $date, or null. Touches the DB; the
     * caller (`rate()`) is responsible for memoizing.
     */
    private function lookup(string $from, string $to, Carbon $date): ?float
    {
        $row = ExchangeRate::query()
            ->where('from_currency', $from)
            ->where('to_currency', $to)
            ->where('rate_date', '<=', $date->toDateString())
            ->orderByDesc('rate_date')
            ->first();

        return $row !== null ? (float) $row->rate : null;
    }
}
