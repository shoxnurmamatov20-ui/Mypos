<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services\RateProviders;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Phase 4 — fixer.io fallback when the central-bank APIs are unreachable.
 *
 * Real endpoint: `GET https://data.fixer.io/api/latest?access_key={KEY}&base=USD`
 * (free tier is EUR-only base; paid tier supports `base=` override).
 *
 * Activated only when the primary central-bank provider returned [] for a
 * given base. The sync job logs which provider was used so SRE can correlate
 * any anomalies with cbu.uz / nbt.tj outages.
 *
 * Stub-only for now — real implementation requires a fixer.io API key in
 * `config/services.php`. When wired, do NOT call this on every cron tick:
 * it has a low monthly quota on the free plan.
 */
final class FixerRateProvider implements RateProviderInterface
{
    public function name(): string
    {
        return 'fixer';
    }

    /**
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    public function fetch(string $base = 'USD', ?Carbon $date = null): array
    {
        $base = strtoupper($base);
        $date ??= Carbon::today();

        $apiKey = (string) config('services.fixer.access_key', '');
        if ($apiKey === '') {
            // Fixer not configured — degrade to stub. SRE: set
            // FIXER_ACCESS_KEY in Coolify when free-tier coverage is
            // needed.
            return $this->stub($base, $date);
        }

        try {
            $response = Http::timeout(8)
                ->retry(2, 500)
                ->acceptJson()
                ->get('https://data.fixer.io/api/latest', [
                    'access_key' => $apiKey,
                    'base' => $base,
                ]);

            if (! $response->successful() || $response->json('success') !== true) {
                return [];
            }

            /** @var array<string, float|int|string> $rates */
            $rates = (array) $response->json('rates', []);
            $dateStr = $date->toDateString();
            $out = [];
            foreach ($rates as $code => $rate) {
                $codeUpper = strtoupper((string) $code);
                if (! is_numeric($rate) || (float) $rate <= 0.0 || $codeUpper === $base) {
                    continue;
                }
                $r = (float) $rate;
                $out[] = ['from' => $base, 'to' => $codeUpper, 'rate' => $r, 'rate_date' => $dateStr];
                $out[] = ['from' => $codeUpper, 'to' => $base, 'rate' => 1.0 / $r, 'rate_date' => $dateStr];
            }
            return $out;
        } catch (Throwable $e) {
            Log::warning('FixerRateProvider: fetch failed', [
                'base' => $base,
                'date' => $date->toDateString(),
                'exception' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * @return list<array{from: string, to: string, rate: float, rate_date: string}>
     */
    private function stub(string $base, Carbon $date): array
    {
        if ($base !== 'USD') {
            return [];
        }
        $dateStr = $date->toDateString();

        // 1 USD = N — Q2 2026 baselines, only used when central bank
        // providers fail for a given currency.
        $rates = [
            'EUR' => 0.934,
            'RUB' => 92.4,
            'UZS' => 12805.0,
            'KZT' => 484.5,
            'KGS' => 87.92,
            'TJS' => 10.85,
        ];

        $out = [];
        foreach ($rates as $code => $rate) {
            $out[] = ['from' => 'USD', 'to' => $code, 'rate' => (float) $rate, 'rate_date' => $dateStr];
            $out[] = ['from' => $code, 'to' => 'USD', 'rate' => 1.0 / (float) $rate, 'rate_date' => $dateStr];
        }

        return $out;
    }
}
