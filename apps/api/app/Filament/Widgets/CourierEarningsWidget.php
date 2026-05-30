<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use Carbon\CarbonImmutable;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Snapshot of courier delivery activity for the past day / week.
 *
 * The widget queries the `orders` table directly: orders of type
 * `delivery` that have a non-null `delivered_at`. Earnings are summed
 * from the `courier_earnings_minor` integer column (added by the
 * delivery migration).
 *
 * Polling: 60s. Skipped gracefully if the courier columns are not yet
 * present in the schema (during a partial deploy).
 */
class CourierEarningsWidget extends StatsOverviewWidget
{
    /**
     * Polling removed (audit H4) — refreshed via Echo broadcast events on
     * `delivery.delivered`. Stats are also memoised in cache for 60s so
     * concurrent dashboard loads don't re-aggregate the same window.
     */
    protected static ?string $pollingInterval = null;

    protected static ?int $sort = 3;

    /** @return array<string, string> */
    public function getListeners(): array
    {
        $tenantId = optional(auth()->user())->tenant_id;
        if ($tenantId === null) {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.delivery.delivered" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.delivery.picked_up" => '$refresh',
        ];
    }

    /** @return array<int, Stat> */
    protected function getStats(): array
    {
        if (! Schema::hasColumn('orders', 'delivered_at')) {
            return [
                Stat::make('Yetkazib berish', 'Tez orada')
                    ->description('Migratsiya kutilmoqda')
                    ->descriptionIcon('heroicon-o-truck')
                    ->color('gray'),
            ];
        }

        $now = CarbonImmutable::now();
        $todayStart = $now->startOfDay();
        $todayEnd = $now->endOfDay();
        $weekStart = $now->subDays(7)->startOfDay();

        return [
            $this->todayDeliveriesStat($todayStart, $todayEnd),
            $this->todayEarningsStat($todayStart, $todayEnd),
            $this->weekDeliveriesStat($weekStart, $todayEnd),
            $this->avgDeliveryTimeStat($todayStart, $todayEnd),
        ];
    }

    private function todayDeliveriesStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $count = Order::query()
            ->where('type', OrderType::Delivery->value)
            ->whereBetween('delivered_at', [$from, $until])
            ->count();

        return Stat::make('Bugungi yetkazmalar', (string) $count)
            ->description("Yetkazib berilgan buyurtmalar")
            ->descriptionIcon('heroicon-o-truck')
            ->color('success');
    }

    private function todayEarningsStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $hasColumn = Schema::hasColumn('orders', 'courier_earnings_minor');
        if (! $hasColumn) {
            return Stat::make('Bugungi daromad', '—')
                ->description("Kuryer daromadi (so'm)")
                ->descriptionIcon('heroicon-o-banknotes')
                ->color('warning');
        }

        $sumMinor = (int) Order::query()
            ->where('type', OrderType::Delivery->value)
            ->whereBetween('delivered_at', [$from, $until])
            ->sum('courier_earnings_minor');

        $sumSom = (int) round($sumMinor / 100);

        return Stat::make("Bugungi daromad", number_format($sumSom, 0, '.', ' ') . " so'm")
            ->description('Kuryerlar jami')
            ->descriptionIcon('heroicon-o-banknotes')
            ->color('primary');
    }

    private function weekDeliveriesStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $count = Order::query()
            ->where('type', OrderType::Delivery->value)
            ->whereBetween('delivered_at', [$from, $until])
            ->count();

        return Stat::make('Hafta ichida', (string) $count)
            ->description("So'nggi 7 kun")
            ->descriptionIcon('heroicon-o-calendar-days')
            ->color('info');
    }

    /**
     * Audit H3: replaced the per-order foreach loop (previously hydrated every
     * delivery in the window into Eloquent models, then walked them in PHP)
     * with a single SQL aggregate using `EXTRACT(EPOCH FROM ...)/60`. This
     * scales O(1) at the DB layer instead of O(N) at the PHP layer.
     *
     * Result is memoised in cache for 60 seconds so concurrent dashboard
     * renders share a single aggregate.
     */
    private function avgDeliveryTimeStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        if (! Schema::hasColumn('orders', 'picked_up_at')) {
            return Stat::make("O'rtacha vaqt", '—')
                ->description('Yetkazib berish vaqti')
                ->descriptionIcon('heroicon-o-clock')
                ->color('warning');
        }

        $cacheKey = sprintf(
            'widget:courier:avg_delivery:%s:%s:%s',
            (string) (optional(auth()->user())->tenant_id ?? 'global'),
            $from->toIso8601String(),
            $until->toIso8601String(),
        );

        $avg = Cache::remember($cacheKey, 60, function () use ($from, $until): ?float {
            // Avg minutes between pickup and delivery. Driver-portable:
            // Postgres uses EXTRACT(EPOCH); MySQL uses TIMESTAMPDIFF(SECOND).
            $expr = DB::connection()->getDriverName() === 'pgsql'
                ? 'AVG(EXTRACT(EPOCH FROM (delivered_at - picked_up_at)) / 60)'
                : 'AVG(TIMESTAMPDIFF(SECOND, picked_up_at, delivered_at) / 60)';

            return Order::query()
                ->where('type', OrderType::Delivery->value)
                ->whereBetween('delivered_at', [$from, $until])
                ->whereNotNull('picked_up_at')
                ->whereNotNull('delivered_at')
                ->value(DB::raw($expr));
        });

        if ($avg === null) {
            return Stat::make("O'rtacha vaqt", '—')
                ->description('Yetkazib berish vaqti')
                ->descriptionIcon('heroicon-o-clock')
                ->color('warning');
        }

        $minutes = max(0, (int) round((float) $avg));
        if ($minutes === 0) {
            return Stat::make("O'rtacha vaqt", '—')
                ->description('Yetkazib berish vaqti')
                ->descriptionIcon('heroicon-o-clock')
                ->color('warning');
        }

        return Stat::make("O'rtacha vaqt", $minutes . ' min')
            ->description('Pickup → delivered')
            ->descriptionIcon('heroicon-o-clock')
            ->color('success');
    }
}
