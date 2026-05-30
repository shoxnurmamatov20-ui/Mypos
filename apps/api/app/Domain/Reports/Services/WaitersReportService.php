<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Order\Models\Order;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

/**
 * Waiters / front-of-house performance report. Aggregates orders by the
 * `served_by_id` (waiter / cashier / manager who took the order). Couriers
 * are intentionally excluded — they live in their own report because the
 * KPIs (deliveries / distance / earnings) don't overlap.
 */
final class WaitersReportService
{
    use NormalizesDateRange;

    private const FOH_POSITIONS = [
        EmployeeRole::Waiter->value,
        EmployeeRole::Cashier->value,
        EmployeeRole::Manager->value,
        EmployeeRole::Admin->value,
    ];

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function generate(?string $from, ?string $to, string $sort = '-revenue'): array
    {
        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);
        $hasTips = Schema::hasColumn('orders', 'tip_amount');

        $tipsSelect = $hasTips
            ? 'COALESCE(SUM(orders.tip_amount), 0) AS tips'
            : '0 AS tips';

        $rows = Order::query()
            ->from('orders')
            ->leftJoin('employees', 'orders.served_by_id', '=', 'employees.id')
            ->leftJoin('users', 'employees.user_uuid', '=', 'users.uuid')
            ->whereBetween('orders.created_at', [$fromCarbon, $toCarbon])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->whereNotNull('orders.served_by_id')
            ->whereIn('employees.position', self::FOH_POSITIONS)
            ->selectRaw(
                "orders.served_by_id AS employee_id,
                 MAX(users.name) AS name,
                 MAX(employees.position) AS position,
                 COUNT(*) AS cnt,
                 COALESCE(SUM(orders.total_amount), 0) AS revenue,
                 COALESCE(SUM(orders.guest_count), 0) AS guests,
                 {$tipsSelect},
                 MAX(orders.created_at) AS last_used_at"
            )
            ->groupBy('orders.served_by_id')
            ->get();

        $data = $rows->map(function ($row): array {
            $cnt = (int) $row->cnt;
            $revenue = (int) $row->revenue;
            return [
                'employee_id' => (string) $row->employee_id,
                'name' => (string) ($row->name ?? '—'),
                'position' => (string) ($row->position ?? ''),
                'orders_count' => $cnt,
                'revenue_minor' => $revenue,
                'guests_total' => (int) $row->guests,
                'avg_ticket_minor' => $cnt > 0 ? (int) round($revenue / $cnt) : 0,
                'tips_minor' => (int) $row->tips,
                'last_used_at' => $row->last_used_at !== null
                    ? Carbon::parse((string) $row->last_used_at)->toIso8601String()
                    : null,
            ];
        })->values()->all();

        $data = $this->sortRows($data, $sort);

        return [
            'data' => $data,
            'meta' => [
                'employees_count' => count($data),
                'total_revenue_minor' => (int) array_sum(array_column($data, 'revenue_minor')),
                'total_orders_count' => (int) array_sum(array_column($data, 'orders_count')),
            ],
        ];
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    private function sortRows(array $rows, string $sort): array
    {
        $direction = str_starts_with($sort, '-') ? -1 : 1;
        $column = ltrim($sort, '-+');
        $map = [
            'revenue' => 'revenue_minor',
            'orders' => 'orders_count',
            'tips' => 'tips_minor',
            'avg_ticket' => 'avg_ticket_minor',
            'guests' => 'guests_total',
        ];
        $key = $map[$column] ?? 'revenue_minor';
        usort($rows, fn (array $a, array $b): int => ($a[$key] <=> $b[$key]) * $direction);
        return $rows;
    }
}
