<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Carbon\CarbonImmutable;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StaffPerformanceWidget extends StatsOverviewWidget
{
    /**
     * Polling removed (audit H4). Refreshed via Echo broadcasts on
     * `shift.opened`, `shift.closed`, `order.placed`. Stats are cached for
     * 60s so concurrent dashboard loads share a single aggregate.
     */
    protected static ?string $pollingInterval = null;

    protected static ?int $sort = 1;

    /** @return array<string, string> */
    public function getListeners(): array
    {
        $tenantId = optional(auth()->user())->tenant_id;
        if ($tenantId === null) {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.shift.opened" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.shift.closed" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.order.placed" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.order.served" => '$refresh',
        ];
    }

    protected function getStats(): array
    {
        $now = CarbonImmutable::now();
        $start = $now->startOfDay();
        $end = $now->endOfDay();

        return [
            $this->activeStaffStat(),
            $this->workedHoursStat($start, $end),
            $this->ordersServedStat($start, $end),
            $this->avgPrepStat($start, $end),
        ];
    }

    private function activeStaffStat(): Stat
    {
        $count = Shift::query()
            ->where('status', ShiftStatus::Open->value)
            ->distinct('employee_id')
            ->count('employee_id');

        return Stat::make('Hozir ishda', (string) $count)
            ->description('Open smenalar soni')
            ->descriptionIcon('heroicon-o-bolt')
            ->color('success');
    }

    /**
     * Audit H3: replaced the per-shift foreach loop with a single SQL
     * aggregate computing
     *   SUM(EXTRACT(EPOCH FROM (COALESCE(actual_end, NOW()) - actual_start))).
     * Result memoised in cache for 60s.
     */
    private function workedHoursStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $cacheKey = sprintf(
            'widget:staff:worked_hours:%s:%s:%s',
            (string) (optional(auth()->user())->tenant_id ?? 'global'),
            $from->toIso8601String(),
            $until->toIso8601String(),
        );

        $totalSeconds = Cache::remember($cacheKey, 60, function () use ($from, $until): float {
            // Driver-portable elapsed-seconds aggregate. Postgres returns
            // INTERVAL from timestamp subtraction; MySQL uses TIMESTAMPDIFF.
            $expr = DB::connection()->getDriverName() === 'pgsql'
                ? 'COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(actual_end, NOW()) - actual_start))), 0)'
                : 'COALESCE(SUM(TIMESTAMPDIFF(SECOND, actual_start, COALESCE(actual_end, NOW()))), 0)';

            return (float) Shift::query()
                ->whereBetween('actual_start', [$from, $until])
                ->whereNotNull('actual_start')
                ->value(DB::raw($expr));
        });

        $hours = round($totalSeconds / 3600, 1);

        return Stat::make('Bugungi soatlar', (string) $hours . ' h')
            ->description('Jami ishlangan vaqt')
            ->descriptionIcon('heroicon-o-clock')
            ->color('info');
    }

    private function ordersServedStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        $waiterIds = Employee::query()
            ->whereIn('position', [EmployeeRole::Waiter->value, EmployeeRole::Cashier->value])
            ->pluck('user_uuid')
            ->all();

        if (count($waiterIds) === 0) {
            return Stat::make('Bugungi buyurtmalar', '0')
                ->description('Ofitsiantlar tomonidan')
                ->descriptionIcon('heroicon-o-shopping-cart')
                ->color('primary');
        }

        $count = Order::query()
            ->whereBetween('created_at', [$from, $until])
            ->whereIn('employee_id', $waiterIds)
            ->count();

        return Stat::make('Bugungi buyurtmalar', (string) $count)
            ->description('Ofitsiantlar tomonidan')
            ->descriptionIcon('heroicon-o-shopping-cart')
            ->color('primary');
    }

    private function avgPrepStat(CarbonImmutable $from, CarbonImmutable $until): Stat
    {
        if (! Schema::hasColumn('order_items', 'prep_duration_seconds')) {
            return Stat::make("O'rtacha pishirish", '—')
                ->description('Bugun')
                ->descriptionIcon('heroicon-o-fire')
                ->color('warning');
        }

        $avgSeconds = (int) OrderItem::query()
            ->whereBetween('ready_at', [$from, $until])
            ->whereNotNull('prep_duration_seconds')
            ->avg('prep_duration_seconds');

        if ($avgSeconds === 0) {
            return Stat::make("O'rtacha pishirish", '—')
                ->description('Bugun')
                ->descriptionIcon('heroicon-o-fire')
                ->color('warning');
        }

        $minutes = intdiv($avgSeconds, 60);
        $seconds = $avgSeconds % 60;
        $label = $minutes > 0
            ? sprintf('%dm %ds', $minutes, $seconds)
            : sprintf('%ds', $seconds);

        return Stat::make("O'rtacha pishirish", $label)
            ->description('Bugun')
            ->descriptionIcon('heroicon-o-fire')
            ->color('warning');
    }
}
