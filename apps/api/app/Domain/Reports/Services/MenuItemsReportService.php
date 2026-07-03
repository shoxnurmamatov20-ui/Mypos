<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Order\Models\OrderItem;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;

/**
 * Menu items report — aggregates `order_items` by menu_item_id over the
 * date range. Returns translated category & item names, gross profit
 * (revenue - cost), and cancelled-quantity for waste tracking.
 */
final class MenuItemsReportService
{
    use NormalizesDateRange;

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, int|float>}
     */
    public function generate(?string $from, ?string $to, ?string $categoryId = null, string $sort = '-revenue'): array
    {
        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);

        // Two SQL passes: one for "sold" items (revenue + quantity), one for
        // cancelled items. A single LEFT JOIN-style aggregation would force a
        // duplicate scan of order_items; this two-pass shape is cheaper on
        // indexed (tenant_id, status) and easy to reason about.
        $sold = OrderItem::query()
            ->from('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->whereBetween('orders.created_at', [$fromCarbon, $toCarbon])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->where('order_items.status', '!=', 'cancelled')
            ->when($categoryId !== null && $categoryId !== '', fn ($q) => $q->where('menu_items.category_id', $categoryId))
            // ANY_VALUE (MySQL 5.7+/PostgreSQL 16+) — these columns are
            // functionally dependent on the GROUP BY key; the old MAX() trick
            // broke on Postgres where max(uuid)/max(jsonb) do not exist.
            ->selectRaw(
                'order_items.menu_item_id,
                 ANY_VALUE(menu_items.category_id) AS category_id,
                 ANY_VALUE(menu_items.name) AS item_name_json,
                 ANY_VALUE(menu_categories.name) AS category_name_json,
                 ANY_VALUE(menu_items.cost_amount) AS unit_cost,
                 COALESCE(SUM(order_items.quantity), 0) AS qty,
                 COALESCE(SUM(order_items.subtotal_amount), 0) AS revenue,
                 COUNT(DISTINCT order_items.order_id) AS orders_cnt'
            )
            ->groupBy('order_items.menu_item_id')
            ->get();

        $cancelledByItem = OrderItem::query()
            ->from('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$fromCarbon, $toCarbon])
            ->where('order_items.status', 'cancelled')
            ->when($categoryId !== null && $categoryId !== '', function ($q) use ($categoryId): void {
                $q->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                    ->where('menu_items.category_id', $categoryId);
            })
            ->selectRaw('order_items.menu_item_id, COALESCE(SUM(order_items.quantity), 0) AS qty')
            ->groupBy('order_items.menu_item_id')
            ->pluck('qty', 'menu_item_id')
            ->all();

        $data = $sold->map(function ($row) use ($cancelledByItem): array {
            $qty = (float) $row->qty;
            $revenue = (int) $row->revenue;
            $unitCost = (int) ($row->unit_cost ?? 0);
            $cost = (int) round($qty * $unitCost);

            return [
                'menu_item_id' => $row->menu_item_id !== null ? (string) $row->menu_item_id : null,
                'name' => $this->extractTranslation($row->item_name_json),
                'category_id' => $row->category_id !== null ? (string) $row->category_id : null,
                'category_name' => $this->extractTranslation($row->category_name_json),
                'quantity_sold' => $qty,
                'revenue_minor' => $revenue,
                'cost_minor' => $cost,
                'gross_profit_minor' => $revenue - $cost,
                'orders_count' => (int) $row->orders_cnt,
                'cancelled_quantity' => (float) ($cancelledByItem[$row->menu_item_id] ?? 0),
            ];
        })->values()->all();

        $data = $this->sortRows($data, $sort);

        return [
            'data' => $data,
            'meta' => [
                'total_items_sold' => (float) array_sum(array_column($data, 'quantity_sold')),
                'total_revenue_minor' => (int) array_sum(array_column($data, 'revenue_minor')),
                'total_profit_minor' => (int) array_sum(array_column($data, 'gross_profit_minor')),
            ],
        ];
    }

    private function extractTranslation(mixed $raw): string
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
            'quantity' => 'quantity_sold',
            'profit' => 'gross_profit_minor',
            'cancelled' => 'cancelled_quantity',
        ];
        $key = $map[$column] ?? 'revenue_minor';
        usort($rows, fn (array $a, array $b): int => ($a[$key] <=> $b[$key]) * $direction);

        return $rows;
    }
}
