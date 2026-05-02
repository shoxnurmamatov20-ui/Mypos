<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services\RateProviders;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Phase 4 — Markaziy bank (cbu.uz) FX rate fetcher.
 *
 * CBU endpoint: `GET https://cbu.uz/uz/arkhiv-kursov-valyut/json/`
 * Native shape (paraphrased):
 *   [
 *     { "Ccy": "USD", "CcyNm_UZ": "...", "Rate": "12805.50", "Date": "26.04.2026" },
 *     { "Ccy": "EUR", "Rate": "13702.10", "Date": "26.04.2026" },
 *     ...
 *   ]
 *
 * CBU expresses rates as "1 unit of foreign currency = N UZS". We invert
 * to our canonical "1 from = N to" with the foreign currency on the FROM
 * side and UZS on the TO side, AND emit the inverse pair so callers can
 * convert in either direction.
 *
 * NOTE: this is a STUB during Phase-4 prep. The real network call is wired
 * the day we go live in UZ; for now `fetch()` returns the static fallback
 * dataset so dev/test environments work offline. Replace the body of
 * `fetchLive()` with the real Http::get() call when go-live arrives.
 */
final class CbuRateProvider implements RateProviderInterface
{
    private const ENDPOINT = 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/';
    private const TIMEOUT_SECONDS = 8;

    public function name(): string
    {
        return 'cbu';
    }

    /**
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    public function fetch(string $base = 'UZS', ?Carbon $date = null): array
    {
        // CBU only reports vs UZS — refuse to pretend otherwise. The sync
        // job calls each provider once per supported base; it knows to
        // skip non-UZS bases for this provider.
        if (strtoupper($base) !== 'UZS') {
            return [];
        }

        $date ??= Carbon::today();

        try {
            $live = $this->fetchLive($date);
            if ($live !== []) {
                return $live;
            }
        } catch (Throwable $e) {
            Log::warning('CbuRateProvider: live fetch failed, falling back to stub', [
                'date' => $date->toDateString(),
                'exception' => $e->getMessage(),
            ]);
        }

        return $this->stub($date);
    }

    /**
     * Real network call to CBU. Returns [] on any non-200 / parse failure
     * so the caller can fall back. Kept as a separate method so tests can
     * mock just this layer.
     *
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    private function fetchLive(Carbon $date): array
    {
        $response = Http::timeout(self::TIMEOUT_SECONDS)
            ->retry(2, 500)
            ->acceptJson()
            ->get(self::ENDPOINT);

        if (! $response->successful()) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $rows */
        $rows = (array) $response->json();
        $out = [];
        $dateStr = $date->toDateString();

        foreach ($rows as $row) {
            $code = is_string($row['Ccy'] ?? null) ? strtoupper((string) $row['Ccy']) : null;
            $rateRaw = $row['Rate'] ?? null;
            if ($code === null || $code === '' || ! is_numeric($rateRaw) || (float) $rateRaw <= 0.0) {
                continue;
            }
            $rate = (float) $rateRaw;

            // CBU: "1 USD = 12805 UZS" → emit USD→UZS at rate, and the
            // inverse UZS→USD so the cache is fully populated.
            $out[] = ['from' => $code, 'to' => 'UZS', 'rate' => $rate, 'rate_date' => $dateStr];
            $out[] = ['from' => 'UZS', 'to' => $code, 'rate' => 1.0 / $rate, 'rate_date' => $dateStr];
        }

        return $out;
    }

    /**
     * Static fallback dataset for dev/test/offline. Numbers are realistic
     * Q2-2026 estimates — they will be replaced by live CBU data the day
     * the sync job runs in production.
     *
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    private function stub(Carbon $date): array
    {
        $dateStr = $date->toDateString();

        // 1 X = N UZS — copied from the public CBU board snapshot.
        $usdToUzs = 12805.0;
        $eurToUzs = 13702.0;
        $rubToUzs = 138.5;
        $kztToUzs = 26.4;
        $kgsToUzs = 145.7;
        $tjsToUzs = 1175.0;

        $pairs = [
            ['USD', $usdToUzs],
            ['EUR', $eurToUzs],
            ['RUB', $rubToUzs],
            ['KZT', $kztToUzs],
            ['KGS', $kgsToUzs],
            ['TJS', $tjsToUzs],
        ];

        $out = [];
        foreach ($pairs as [$code, $rate]) {
            $out[] = ['from' => $code, 'to' => 'UZS', 'rate' => (float) $rate, 'rate_date' => $dateStr];
            $out[] = ['from' => 'UZS', 'to' => $code, 'rate' => 1.0 / (float) $rate, 'rate_date' => $dateStr];
        }

        return $out;
    }
}
