<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Order\Models\Order;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;
use App\Domain\Table\Models\Table;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Tables report — per-table revenue + occupancy aggregation for a date range.
 *
 * Joined LEFT so empty tables still appear in the response (managers want
 * to identify the dead tables). Occupancy minutes are derived from
 * (served_at - placed_at) per order, summed per table; missing timestamps
 * fall back to 0 for that order rather than skipping the row.
 */
final class TablesReportService
{
    use NormalizesDateRange;

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function generate(?string $from, ?string $to, string $sort = '-revenue'): array
    {
        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);
        $driver = DB::connection()->getDriverName();

        // Inline timezone-naive subtraction expressed in seconds — both Postgres
        // and MySQL evaluate `EXTRACT(EPOCH FROM diff)` differently, so we
        // hand-roll the day/seconds bridge per driver. EPOCH for Postgres,
        // TIMESTAMPDIFF(SECOND, ...) for MySQL — same number on both sides.
        $occupancyExpr = $driver === 'pgsql'
            ? 'COALESCE(SUM(EXTRACT(EPOCH FROM (orders.served_at - orders.placed_at))), 0) / 60'
            : 'COALESCE(SUM(TIMESTAMPDIFF(SECOND, orders.placed_at, orders.served_at)), 0) / 60';

        $rows = Order::query()
            ->from('orders')
            ->leftJoin('tables', 'orders.table_id', '=', 'tables.id')
            ->leftJoin('table_categories', 'tables.category_id', '=', 'table_categories.id')
            ->whereBetween('orders.created_at', [$fromCarbon, $toCarbon])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->whereNotNull('orders.table_id')
            // ANY_VALUE for group-dependent columns (Postgres has no
            // max(jsonb)); MAX(created_at) stays — that one is a real max.
            ->selectRaw(
                "orders.table_id,
                 ANY_VALUE(tables.name) AS name,
                 ANY_VALUE(table_categories.name) AS category_json,
                 COUNT(*) AS cnt,
                 COALESCE(SUM(orders.total_amount), 0) AS revenue,
                 COALESCE(SUM(orders.guest_count), 0) AS guests,
                 {$occupancyExpr} AS occupancy_minutes,
                 MAX(orders.created_at) AS last_used_at"
            )
            ->groupBy('orders.table_id')
            ->get();

        $data = $rows
            ->map(fn ($row): array => $this->shape($row))
            ->values()
            ->all();

        // In-PHP sort because our select aliases (revenue / cnt etc.) span
        // both grouped aggregates and computed columns; pushing this to SQL
        // would require duplicating expressions.
        $data = $this->sortRows($data, $sort);

        // Single round-trip aggregate (was 2 separate count queries). The
        // CASE WHEN bucketises in one index scan; MySQL planner uses the
        // (tenant_id) prefix from the auto-FK index.
        $tablesAgg = Table::query()
            ->selectRaw(
                "COUNT(*) AS total_tables,
                 SUM(CASE WHEN status IN ('available', 'occupied', 'reserved') THEN 1 ELSE 0 END) AS active_tables"
            )
            ->first();
        $totalTables = (int) ($tablesAgg->total_tables ?? 0);
        $activeTables = (int) ($tablesAgg->active_tables ?? 0);
        $totalRevenue = (int) array_sum(array_column($data, 'revenue_minor'));

        return [
            'data' => $data,
            'meta' => [
                'total_tables' => $totalTables,
                'active_tables' => $activeTables,
                'total_revenue_minor' => $totalRevenue,
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function shape(object $row): array
    {
        $cnt = (int) $row->cnt;
        $revenue = (int) $row->revenue;

        return [
            'table_id' => (string) $row->table_id,
            'name' => (string) ($row->name ?? '—'),
            'category' => $this->extractName($row->category_json ?? null),
            'orders_count' => $cnt,
            'revenue_minor' => $revenue,
            'guests_total' => (int) $row->guests,
            'avg_ticket_minor' => $cnt > 0 ? (int) round($revenue / $cnt) : 0,
            'occupancy_minutes' => max(0, (int) round((float) $row->occupancy_minutes)),
            'last_used_at' => $row->last_used_at !== null
                ? Carbon::parse((string) $row->last_used_at)->toIso8601String()
                : null,
        ];
    }

    /**
     * Table & menu category names ride in as JSON text columns (translatable).
     * Pluck the UZ locale by default, fall back to the first non-empty value
     * if the schema row predates the translation rollout.
     */
    private function extractName(mixed $raw): string
    {
        if ($raw === null || $raw === '') {
            return '';
        }
        if (is_array($raw)) {
            return (string) ($raw['uz'] ?? $raw['ru'] ?? $raw['en'] ?? '');
        }
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) {
            return (string) ($decoded['uz'] ?? $decoded['ru'] ?? $decoded['en'] ?? reset($decoded));
        }

        return (string) $raw;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function sortRows(array $rows, string $sort): array
    {
        $direction = str_starts_with($sort, '-') ? -1 : 1;
        $column = ltrim($sort, '-+');
        $map = [
            'revenue' => 'revenue_minor',
            'orders' => 'orders_count',
            'guests' => 'guests_total',
            'occupancy' => 'occupancy_minutes',
            'avg_ticket' => 'avg_ticket_minor',
        ];
        $key = $map[$column] ?? 'revenue_minor';

        usort($rows, function (array $a, array $b) use ($key, $direction): int {
            return ($a[$key] <=> $b[$key]) * $direction;
        });

        return $rows;
    }
}
