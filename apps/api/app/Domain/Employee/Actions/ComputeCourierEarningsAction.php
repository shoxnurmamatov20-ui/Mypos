<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Order\Models\Order;
use Illuminate\Support\Carbon;

/**
 * Compute summary stats for a courier across a date window.
 *
 * Returns a structured array suitable for direct JSON serialisation by the
 * controller. by_day breakdown is included for week/month periods (and as a
 * single bucket for "today" for client-side chart consistency).
 *
 * @phpstan-type EarningsResult array{
 *     period: string,
 *     from: string,
 *     to: string,
 *     deliveries_count: int,
 *     total_earnings_minor: int,
 *     tips_minor: int,
 *     avg_per_delivery_minor: int,
 *     total_distance_meters: int,
 *     active_minutes: int,
 *     by_day: list<array{date: string, deliveries: int, earnings_minor: int}>,
 * }
 */
class ComputeCourierEarningsAction
{
    /** @return EarningsResult */
    public function __invoke(Employee $courier, string $period): array
    {
        [$from, $to] = $this->resolveRange($period);

        $deliveries = Order::query()
            ->where('courier_id', $courier->id)
            ->whereNotNull('delivered_at')
            ->whereBetween('delivered_at', [$from, $to])
            ->get([
                'id',
                'tip_amount',
                'courier_earnings_minor',
                'delivery_distance_meters',
                'delivered_at',
            ]);

        $count = $deliveries->count();
        $earnings = (int) $deliveries->sum(fn (Order $o): int => (int) ($o->courier_earnings_minor ?? 0));
        $tips = (int) $deliveries->sum(fn (Order $o): int => (int) $o->tip_amount);
        $distance = (int) $deliveries->sum(fn (Order $o): int => (int) ($o->delivery_distance_meters ?? 0));

        $shiftMinutes = (int) Shift::query()
            ->where('employee_id', $courier->id)
            ->whereBetween('actual_start', [$from, $to])
            ->whereNotNull('actual_start')
            ->get()
            ->sum(fn (Shift $s): int => $s->workedMinutes());

        $avg = $count > 0 ? (int) round($earnings / $count) : 0;

        $byDay = $deliveries
            ->groupBy(fn (Order $o): string => $o->delivered_at?->toDateString() ?? '')
            ->filter(fn (mixed $_, string $key): bool => $key !== '')
            ->map(fn ($group, string $date): array => [
                'date' => $date,
                'deliveries' => $group->count(),
                'earnings_minor' => (int) $group->sum(
                    fn (Order $o): int => (int) ($o->courier_earnings_minor ?? 0)
                ),
            ])
            ->values()
            ->all();

        return [
            'period' => $period,
            'from' => $from->toIso8601String(),
            'to' => $to->toIso8601String(),
            'deliveries_count' => $count,
            'total_earnings_minor' => $earnings,
            'tips_minor' => $tips,
            'avg_per_delivery_minor' => $avg,
            'total_distance_meters' => $distance,
            'active_minutes' => $shiftMinutes,
            'by_day' => $byDay,
        ];
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function resolveRange(string $period): array
    {
        $now = Carbon::now();
        return match ($period) {
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };
    }
}
