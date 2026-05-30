<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Order\Models\Order;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Courier performance report. Gated behind a paid tier — free-plan tenants
 * receive an empty data array with `meta.locked = true` so the frontend can
 * show its "upgrade to Pro" upsell instead of bouncing the request entirely.
 *
 * The tier check is column-introspected so a hypothetical environment that
 * never ran the tier migration degrades to "always-unlocked" rather than
 * 500ing — the same defensive pattern other tier-gated features (AI, custom
 * apps) follow.
 */
final class CourierReportService
{
    use NormalizesDateRange;

    private const LOCKED_TIERS = ['free'];

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    public function generate(string $tenantId, ?string $from, ?string $to, string $sort = '-deliveries'): array
    {
        if ($this->isLocked($tenantId)) {
            return [
                'data' => [],
                'meta' => [
                    'locked' => true,
                    'reason' => 'tier_upgrade_required',
                    'required_tier' => 'pro',
                ],
            ];
        }

        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);
        $driver = DB::connection()->getDriverName();
        $hasDistance = Schema::hasColumn('orders', 'delivery_distance_meters');
        $hasTips = Schema::hasColumn('orders', 'tip_amount');

        $deliveryMinutesExpr = $driver === 'pgsql'
            ? 'COALESCE(AVG(EXTRACT(EPOCH FROM (orders.delivered_at - orders.picked_up_at))) / 60, 0)'
            : 'COALESCE(AVG(TIMESTAMPDIFF(SECOND, orders.picked_up_at, orders.delivered_at)) / 60, 0)';

        $distanceSelect = $hasDistance
            ? 'COALESCE(SUM(orders.delivery_distance_meters), 0) AS distance_meters'
            : '0 AS distance_meters';
        $tipsSelect = $hasTips
            ? 'COALESCE(SUM(orders.tip_amount), 0) AS tips'
            : '0 AS tips';

        $rows = Order::query()
            ->from('orders')
            ->leftJoin('employees', 'orders.courier_id', '=', 'employees.id')
            ->leftJoin('users', 'employees.user_uuid', '=', 'users.uuid')
            ->whereBetween('orders.created_at', [$fromCarbon, $toCarbon])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->whereNotNull('orders.courier_id')
            ->where('employees.position', EmployeeRole::Courier->value)
            ->selectRaw(
                "orders.courier_id AS courier_id,
                 MAX(users.name) AS name,
                 COUNT(*) AS deliveries,
                 COALESCE(SUM(orders.total_amount), 0) AS revenue,
                 {$deliveryMinutesExpr} AS avg_minutes,
                 {$distanceSelect},
                 {$tipsSelect}"
            )
            ->groupBy('orders.courier_id')
            ->get();

        $data = $rows->map(function ($row): array {
            return [
                'courier_id' => (string) $row->courier_id,
                'name' => (string) ($row->name ?? '—'),
                'deliveries_count' => (int) $row->deliveries,
                'revenue_delivered_minor' => (int) $row->revenue,
                'avg_delivery_minutes' => round((float) $row->avg_minutes, 1),
                'total_distance_km' => round(((int) $row->distance_meters) / 1000, 2),
                'tips_minor' => (int) $row->tips,
            ];
        })->values()->all();

        $data = $this->sortRows($data, $sort);

        return [
            'data' => $data,
            'meta' => [
                'locked' => false,
                'couriers_count' => count($data),
                'total_deliveries' => (int) array_sum(array_column($data, 'deliveries_count')),
                'total_revenue_minor' => (int) array_sum(array_column($data, 'revenue_delivered_minor')),
            ],
        ];
    }

    private function isLocked(string $tenantId): bool
    {
        if (! Schema::hasColumn('tenants', 'tier')) {
            return false;
        }
        $tier = (string) (Tenant::query()
            ->whereKey($tenantId)
            ->value('tier') ?? 'free');
        return in_array(strtolower($tier), self::LOCKED_TIERS, true);
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
            'deliveries' => 'deliveries_count',
            'revenue' => 'revenue_delivered_minor',
            'distance' => 'total_distance_km',
            'tips' => 'tips_minor',
            'avg_minutes' => 'avg_delivery_minutes',
        ];
        $key = $map[$column] ?? 'deliveries_count';
        usort($rows, fn (array $a, array $b): int => ($a[$key] <=> $b[$key]) * $direction);
        return $rows;
    }
}
