<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use Carbon\CarbonImmutable;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Snapshot of kiosk channel performance.
 *
 * Pulls from `orders` (type=kiosk) for revenue / volume and from
 * `kiosk_devices` (status=paired AND last_seen_at within 5 minutes) for
 * fleet liveness. Each stat falls back gracefully if the underlying
 * column has not been migrated yet.
 */
class KioskRevenueWidget extends StatsOverviewWidget
{
    /**
     * Polling removed (audit H4) — we rely on Echo broadcasts for kiosk
     * order/heartbeat events plus a 60s cache layer for the aggregates.
     */
    protected static ?string $pollingInterval = null;

    protected static ?int $sort = 5;

    /** @return array<string, string> */
    public function getListeners(): array
    {
        $tenantId = optional(auth()->user())->tenant_id;
        if ($tenantId === null) {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.order.placed" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.heartbeat" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.paired" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.unpaired" => '$refresh',
        ];
    }

    /** @return array<int, Stat> */
    protected function getStats(): array
    {
        $now = CarbonImmutable::now();
        $todayStart = $now->startOfDay();
        $todayEnd = $now->endOfDay();

        return [
            $this->todayOrdersStat($todayStart, $todayEnd),
            $this->todayRevenueStat($todayStart, $todayEnd),
            $this->activeKiosksStat($now),
            $this->avgOrderValueStat($todayStart, $todayEnd),
        ];
    }

    /**
     * Audit M4: cache the per-window aggregate so a busy dashboard does not
     * re-aggregate the same range for every dashboard load. Tenant-scoped so
     * a super admin viewing many tenants doesn't share keys.
     */
    private function cacheKey(string $stat, CarbonImmutable $from, CarbonImmutable $until): string
    {
        return sprintf(
            'widget:kiosk:%s:%s:%s:%s',
            $stat,
            (string) (optional(auth()->user())->tenant_id ?? 'global'),
            $from->toIso8601String(),
            $until->toIso8601String(),
        );
    }

    private function todayOrdersStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $count = Cache::remember(
            $this->cacheKey('today_orders', $from, $until),
            60,
            fn (): int => Order::query()
                ->where('type', OrderType::Kiosk->value)
                ->whereBetween('created_at', [$from, $until])
                ->count(),
        );

        return Stat::make('Bugungi kiosk buyurtmalari', (string) $count)
            ->description('Kiosk kanalidagi buyurtmalar')
            ->descriptionIcon('heroicon-o-computer-desktop')
            ->color('primary');
    }

    private function todayRevenueStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $sumMinor = Cache::remember(
            $this->cacheKey('today_revenue', $from, $until),
            60,
            fn (): int => (int) Order::query()
                ->where('type', OrderType::Kiosk->value)
                ->whereBetween('created_at', [$from, $until])
                ->sum('total_amount'),
        );

        $sumSom = (int) round($sumMinor / 100);

        return Stat::make('Bugungi kiosk daromadi', number_format($sumSom, 0, '.', ' ') . " so'm")
            ->description("Kiosk orqali tushgan summa")
            ->descriptionIcon('heroicon-o-banknotes')
            ->color('success');
    }

    private function activeKiosksStat(CarbonImmutable $now): Stat
    {
        if (! Schema::hasTable('kiosk_devices')) {
            return Stat::make('Faol kiosklar', '—')
                ->description('Migratsiya kutilmoqda')
                ->descriptionIcon('heroicon-o-signal-slash')
                ->color('gray');
        }

        $threshold = $now->subMinutes(5);
        // Cache key on the truncated 5-minute window so the count stays
        // stable until the next bucket — short enough that newly-paired
        // kiosks are reflected within ~1 minute via Echo.
        $key = sprintf(
            'widget:kiosk:active_kiosks:%s:%s',
            (string) (optional(auth()->user())->tenant_id ?? 'global'),
            (string) $threshold->getTimestamp(),
        );
        $count = Cache::remember(
            $key,
            60,
            fn (): int => KioskDevice::query()
                ->where('status', KioskDeviceStatus::Paired->value)
                ->where('last_seen_at', '>=', $threshold)
                ->count(),
        );

        return Stat::make('Faol kiosklar', (string) $count)
            ->description("So'nggi 5 daqiqa ichida ulangan")
            ->descriptionIcon('heroicon-o-signal')
            ->color($count > 0 ? 'success' : 'warning');
    }

    private function avgOrderValueStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $avgMinor = Cache::remember(
            $this->cacheKey('avg_order_value', $from, $until),
            60,
            fn (): float => (float) Order::query()
                ->where('type', OrderType::Kiosk->value)
                ->whereBetween('created_at', [$from, $until])
                ->avg('total_amount'),
        );

        if ($avgMinor <= 0) {
            return Stat::make("O'rtacha buyurtma", '—')
                ->description('Bugun kiosk buyurtmasi yoq')
                ->descriptionIcon('heroicon-o-calculator')
                ->color('gray');
        }

        $avgSom = (int) round($avgMinor / 100);

        return Stat::make("O'rtacha buyurtma", number_format($avgSom, 0, '.', ' ') . " so'm")
            ->description("Bugungi kiosk buyurtmalarining o'rtachasi")
            ->descriptionIcon('heroicon-o-calculator')
            ->color('info');
    }
}
