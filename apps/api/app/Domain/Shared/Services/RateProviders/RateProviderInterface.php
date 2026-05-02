<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services\RateProviders;

use Illuminate\Support\Carbon;

/**
 * Phase 4 — common contract for daily FX rate fetchers.
 *
 * Each Central-Asia central bank publishes rates in its own format; CBU
 * (Markaziy bank) returns JSON keyed by ISO-3 codes, NBP (Tojikiston)
 * returns XML, NBKR (Qirg'iziston) returns RSS. All implementations must
 * normalise to the same array shape so {@see \App\Jobs\SyncFxRatesJob} can
 * insert without caring about the source.
 *
 * Each returned row represents "1 unit of `from` currency = `rate` units of
 * `to` currency". The provider is responsible for inverting the source's
 * native direction if needed (CBU publishes "X UZS = 1 USD" — providers
 * must invert that to "1 USD = X UZS" before returning).
 *
 * Implementations:
 *   - {@see CbuRateProvider} — Markaziy bank, primary for UZS pairs
 *   - {@see NbpRateProvider} — Tojikiston, primary for TJS pairs
 *   - {@see NbkrRateProvider} — Qirg'iziston, primary for KGS pairs
 *   - {@see FixerRateProvider} — fixer.io fallback
 *   - {@see ManualRateProvider} — operator override (super admin)
 */
interface RateProviderInterface
{
    /**
     * Source identifier persisted in `exchange_rates.source`. Stable
     * 32-char-or-fewer slug (cbu, nbp, nbkr, fixer, manual).
     */
    public function name(): string;

    /**
     * Pull today's (or $date's) rates. Idempotent — calling twice should
     * return the same data within a single business day.
     *
     * Implementations MUST NOT throw on transient HTTP failure; return an
     * empty array and log instead, so the sync job can move on to the next
     * provider without aborting the batch.
     *
     * @param  string  $base  ISO 4217 — provider returns rates expressed
     *                        relative to this currency. Most central banks
     *                        ignore this and always return their native
     *                        currency as the base; that's documented per
     *                        implementation.
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     *         where rate_date is YYYY-MM-DD.
     */
    public function fetch(string $base = 'UZS', ?Carbon $date = null): array;
}
