<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Shared\Models\ExchangeRate;
use Carbon\CarbonImmutable;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Current rate cards rendered above the {@see \App\Filament\Resources\ExchangeRateResource}.
 *
 * Shows the latest rate for the four "home" pairs that the Phase-4 launch
 * cares about most: UZS↔USD, KZT↔USD, KGS↔USD, TJS↔USD. Each card surfaces:
 *   - The rate (formatted with currency-appropriate decimals)
 *   - The freshness badge (green if fetched within the last 26h, red otherwise)
 *   - The source provider tag (cbu / nbp / fixer / manual)
 *
 * "26h" is the SLA target — the daily fetch job should always have run within
 * that window. If a card stays red, on-call should investigate.
 *
 * Cached for 5 minutes per pair to keep the resource list snappy when the
 * operator is paginating filters.
 */
class CurrentFxRatesWidget extends StatsOverviewWidget
{
    protected static ?string $pollingInterval = null;

    protected static ?int $sort = 1;

    /** Pairs displayed as cards. */
    private const PAIRS = [
        ['from' => 'USD', 'to' => 'UZS'],
        ['from' => 'USD', 'to' => 'KZT'],
        ['from' => 'USD', 'to' => 'KGS'],
        ['from' => 'USD', 'to' => 'TJS'],
    ];

    /** @return array<int, Stat> */
    protected function getStats(): array
    {
        if (! Schema::hasTable('exchange_rates')) {
            return [
                Stat::make(__('region.fx.widget.unavailable'), '—')
                    ->description(__('region.fx.widget.unavailable_help'))
                    ->color('gray'),
            ];
        }

        $stats = [];
        foreach (self::PAIRS as $pair) {
            $stats[] = $this->pairStat($pair['from'], $pair['to']);
        }
        return $stats;
    }

    private function pairStat(string $from, string $to): Stat
    {
        $row = Cache::remember(
            "widget:fx:{$from}:{$to}",
            300,
            fn (): ?ExchangeRate => ExchangeRate::query()
                ->where('from_currency', $from)
                ->where('to_currency', $to)
                ->orderByDesc('rate_date')
                ->first(),
        );

        if ($row === null) {
            return Stat::make("{$from} → {$to}", '—')
                ->description(__('region.fx.widget.no_data'))
                ->color('gray');
        }

        $rate = (float) $row->rate;
        $formatted = $this->formatRate($rate, $to);

        $fetchedAt = $row->fetched_at instanceof CarbonImmutable
            ? $row->fetched_at
            : CarbonImmutable::parse((string) $row->fetched_at);

        $isStale = $fetchedAt->lt(CarbonImmutable::now()->subHours(26));

        return Stat::make("{$from} → {$to}", $formatted)
            ->description(
                ($row->source ?? '—')
                . ' · ' . $fetchedAt->diffForHumans(),
            )
            ->descriptionIcon($isStale ? 'heroicon-o-exclamation-triangle' : 'heroicon-o-arrow-path')
            ->color($isStale ? 'warning' : 'success');
    }

    /**
     * Format a rate with currency-appropriate decimals — UZS / KZT / KGS / TJS
     * are all whole-numbers in practice (rates of 12,800+ to USD), while a
     * USD↔EUR pair would render with 4 decimals if added later.
     */
    private function formatRate(float $rate, string $to): string
    {
        $decimals = match ($to) {
            'UZS', 'KZT', 'KGS', 'RUB' => 2,
            'USD', 'EUR' => 4,
            default => 2,
        };

        return number_format($rate, $decimals, '.', ',');
    }
}
