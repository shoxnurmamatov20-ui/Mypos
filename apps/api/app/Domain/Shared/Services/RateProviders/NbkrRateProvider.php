<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services\RateProviders;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Phase 4 — Qirg'iz Respublikasining Milliy banki (nbkr.kg) FX rate fetcher.
 *
 * Endpoint (live, when wired): `GET https://www.nbkr.kg/XML/daily.xml`
 * Returns daily KGS rates against the major foreign currencies.
 *
 * Stub-only for now — real implementation lands the day we launch in KG.
 *
 * Output shape matches {@see RateProviderInterface}: `1 from = N to`.
 */
final class NbkrRateProvider implements RateProviderInterface
{
    public function name(): string
    {
        return 'nbkr';
    }

    /**
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    public function fetch(string $base = 'KGS', ?Carbon $date = null): array
    {
        if (strtoupper($base) !== 'KGS') {
            return [];
        }

        $date ??= Carbon::today();

        try {
            // TODO: Replace with live Http::get() once nbkr.kg XML feed is
            // wired during KG launch checklist.
            return $this->stub($date);
        } catch (Throwable $e) {
            Log::warning('NbkrRateProvider: fetch failed', [
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

        // 1 X = N KGS — Q2 2026 realistic rates.
        $usdToKgs = 87.92;
        $eurToKgs = 94.25;
        $rubToKgs = 0.951;
        $kztToKgs = 0.181;

        $pairs = [
            ['USD', $usdToKgs],
            ['EUR', $eurToKgs],
            ['RUB', $rubToKgs],
            ['KZT', $kztToKgs],
        ];

        $out = [];
        foreach ($pairs as [$code, $rate]) {
            $out[] = ['from' => $code, 'to' => 'KGS', 'rate' => (float) $rate, 'rate_date' => $dateStr];
            $out[] = ['from' => 'KGS', 'to' => $code, 'rate' => 1.0 / (float) $rate, 'rate_date' => $dateStr];
        }

        return $out;
    }
}
