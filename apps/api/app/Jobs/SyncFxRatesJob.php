<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Shared\Models\Currency;
use App\Domain\Shared\Models\ExchangeRate;
use App\Domain\Shared\Services\FxRateService;
use App\Domain\Shared\Services\RateProviders\CbuRateProvider;
use App\Domain\Shared\Services\RateProviders\FixerRateProvider;
use App\Domain\Shared\Services\RateProviders\NbkrRateProvider;
use App\Domain\Shared\Services\RateProviders\NbpRateProvider;
use App\Domain\Shared\Services\RateProviders\RateProviderInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\NotTenantAware;
use Throwable;

/**
 * Phase 4 — daily FX rate sync.
 *
 * Scheduled in `routes/console.php` to run at 02:00 local time, after the
 * Markaziy bank's overnight refresh window. Idempotent: re-running on the
 * same day overwrites that day's rows via the unique
 * `(from_currency, to_currency, rate_date)` index — we use upsert so any
 * minor in-day correction propagates immediately.
 *
 * Provider strategy:
 *   1. Iterate over each ACTIVE currency in the `currencies` table.
 *   2. For each, ask the relevant central-bank provider (CBU for UZS,
 *      NBP for TJS, NBKR for KGS).
 *   3. If a provider returns [] (network fail / unsupported base),
 *      fall back to Fixer for that base.
 *   4. Upsert all returned rows in a single bulk statement.
 *   5. Bust the FxRateService cache for today so fresh rates are visible
 *      immediately, not after the 6-hour TTL.
 *
 * NotTenantAware: this is platform-wide infrastructure data; it must NOT
 * resolve a tenant context (which would fail when run from cron with no
 * authenticated user).
 *
 * Per-iteration try/catch so a single bad provider can't kill the whole
 * sweep. Failures are logged at warning level — the job itself only
 * fails(1) if EVERY provider returns [].
 */
class SyncFxRatesJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 180;

    public function __construct(
        private readonly ?Carbon $rateDate = null,
    ) {}

    public function handle(FxRateService $fxService): void
    {
        $date = $this->rateDate ?? Carbon::today();

        // Resolve providers from the container so tests can swap them via
        // App::bind() without monkey-patching this job.
        /** @var array<string, RateProviderInterface> $primary */
        $primary = [
            'UZS' => app(CbuRateProvider::class),
            'TJS' => app(NbpRateProvider::class),
            'KGS' => app(NbkrRateProvider::class),
        ];
        $fallback = app(FixerRateProvider::class);

        $activeCurrencies = Currency::query()
            ->where('is_active', true)
            ->pluck('code')
            ->all();

        $allRows = [];
        $providerHits = []; // per-base provider name, for the audit log
        $totalFetched = 0;

        foreach ($activeCurrencies as $code) {
            $code = strtoupper((string) $code);
            $provider = $primary[$code] ?? null;

            try {
                $rows = $provider !== null ? $provider->fetch($code, $date) : [];
                if ($rows === [] && $provider !== null) {
                    Log::info('SyncFxRatesJob: primary returned no rows, trying fallback', [
                        'base' => $code,
                        'primary' => $provider->name(),
                    ]);
                }
            } catch (Throwable $e) {
                Log::warning('SyncFxRatesJob: primary provider threw', [
                    'base' => $code,
                    'provider' => $provider?->name(),
                    'exception' => $e->getMessage(),
                ]);
                $rows = [];
            }

            // Fallback if primary failed AND we have a Fixer key (or stub).
            if ($rows === []) {
                try {
                    $rows = $fallback->fetch($code, $date);
                    if ($rows !== []) {
                        $providerHits[$code] = $fallback->name();
                    }
                } catch (Throwable $e) {
                    Log::warning('SyncFxRatesJob: fallback failed', [
                        'base' => $code,
                        'exception' => $e->getMessage(),
                    ]);
                }
            } else {
                $providerHits[$code] = $provider?->name() ?? 'unknown';
            }

            foreach ($rows as $row) {
                $allRows[] = [
                    'from_currency' => strtoupper((string) $row['from']),
                    'to_currency'   => strtoupper((string) $row['to']),
                    'rate'          => (string) $row['rate'],
                    'source'        => $providerHits[$code] ?? 'unknown',
                    'rate_date'     => (string) $row['rate_date'],
                    'fetched_at'    => now(),
                    'created_at'    => now(),
                ];
                $totalFetched++;
            }
        }

        if ($allRows === []) {
            Log::error('SyncFxRatesJob: no rates fetched from any provider', [
                'date' => $date->toDateString(),
            ]);
            $this->fail(new \RuntimeException('All FX providers returned empty result sets'));
            return;
        }

        // Upsert in a single bulk statement. The unique index on
        // (from, to, rate_date) means re-running today simply overwrites
        // today's rates — perfect for cron retries.
        DB::transaction(function () use ($allRows): void {
            ExchangeRate::query()->upsert(
                $allRows,
                ['from_currency', 'to_currency', 'rate_date'],
                ['rate', 'source', 'fetched_at'],
            );
        });

        // Bust the FxRateService cache for every (from, to) pair we just
        // wrote on $date. The 6-hour TTL otherwise makes fresh rates wait,
        // which is unacceptable for receipts after a major rate move.
        foreach ($allRows as $row) {
            $fxService->forget($row['from_currency'], $row['to_currency'], $date);
        }

        Log::info('SyncFxRatesJob: ok', [
            'date' => $date->toDateString(),
            'rows' => $totalFetched,
            'providers' => $providerHits,
        ]);
    }
}
