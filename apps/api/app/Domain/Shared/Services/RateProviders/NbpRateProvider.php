<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services\RateProviders;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Phase 4 — Tojikiston Milliy banki (nbt.tj) FX rate fetcher.
 *
 * Endpoint (live, when wired): `GET https://nbt.tj/tj/kurs/kurs.php?date=YYYY-MM-DD&export=xml`
 *
 * Stub-only for now — real implementation lands the day we launch in TJ.
 * Returns realistic baseline numbers so dev/test work offline.
 *
 * Same canonical output shape as {@see CbuRateProvider}: `1 from = N to`
 * (NEVER inverted at this layer — the sync job sees the same shape from
 * every provider).
 */
final class NbpRateProvider implements RateProviderInterface
{
    public function name(): string
    {
        return 'nbp';
    }

    /**
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    public function fetch(string $base = 'TJS', ?Carbon $date = null): array
    {
        if (strtoupper($base) !== 'TJS') {
            return [];
        }

        $date ??= Carbon::today();

        try {
            // TODO: Replace with live Http::get() once nbt.tj endpoint is
            // confirmed during TJ launch checklist.
            return $this->stub($date);
        } catch (Throwable $e) {
            Log::warning('NbpRateProvider: fetch failed', [
                'date' => $date->toDateString(),
                'exception' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    private function stub(Carbon $date): array
    {
        $dateStr = $date->toDateString();

        // 1 X = N TJS — Q2 2026 realistic rates.
        $usdToTjs = 10.85;
        $eurToTjs = 11.62;
        $rubToTjs = 0.118;
        $uzsToTjs = 0.000852;

        $pairs = [
            ['USD', $usdToTjs],
            ['EUR', $eurToTjs],
            ['RUB', $rubToTjs],
            ['UZS', $uzsToTjs],
        ];

        $out = [];
        foreach ($pairs as [$code, $rate]) {
            $out[] = ['from' => $code, 'to' => 'TJS', 'rate' => (float) $rate, 'rate_date' => $dateStr];
            $out[] = ['from' => 'TJS', 'to' => $code, 'rate' => 1.0 / (float) $rate, 'rate_date' => $dateStr];
        }

        return $out;
    }
}
