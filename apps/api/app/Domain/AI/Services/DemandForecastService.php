<?php

declare(strict_types=1);

namespace App\Domain\AI\Services;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Phase-4 — statistical demand forecasting (no AI required).
 *
 * Pure SQL aggregation over `order_items` joined to `orders`. Three public
 * surfaces:
 *
 *   - {@see topItemsForRestaurant()} — best sellers in the trailing window,
 *     bucketed by day-of-week and hour-of-day so the dashboard can render
 *     "what sells and when". Pro+ tier feature.
 *
 *   - {@see predictNextWeek()} — naive regression that takes each item's
 *     average daily quantity per day-of-week and projects it onto the next
 *     7 calendar days. Plus+ tier (predictive analytics).
 *
 *   - {@see lowSellersToRetire()} — items that have moved < $threshold
 *     units in the trailing 60 days; surfaced as candidates to remove from
 *     the menu. Pro+ tier (basic forecasting).
 *
 * All queries explicitly filter `tenant_id` (the tables use the
 * BelongsToTenant global scope, but we go through the query builder here
 * for performance, so we re-add the filter manually).
 *
 * Cancelled orders are excluded — they would skew demand upward without
 * representing actual cooked covers. Refunded orders are still counted
 * (the food was prepared / fired).
 *
 * Runtime: index on `orders(tenant_id, created_at, status)` + the existing
 * `order_items(menu_item_id)` FK index keeps these queries sub-100ms even
 * on 100k-order tenants. The aggregation is read-only and never invokes
 * the AI provider — call {@see \App\Domain\AI\Actions\AnalyzeRestaurantInsightsAction}
 * if you want a Claude-narrated version.
 */
final class DemandForecastService
{
    /** Cancelled orders are excluded from all aggregations. */
    private const EXCLUDED_STATUSES = ['cancelled'];

    /** Default trailing window for "top items". */
    public const DEFAULT_TOP_DAYS = 30;

    /** Default trailing window for "low sellers". */
    public const DEFAULT_RETIRE_DAYS = 60;

    /** Items with strictly fewer than this in the window are flagged. */
    public const RETIRE_THRESHOLD = 5;

    /**
     * Top-selling menu items in the trailing window, bucketed by DOW + hour.
     *
     * Returns an array shaped:
     *
     *   [
     *     [
     *       'menu_item_id'      => '01HQ...',
     *       'name'              => 'Margherita',
     *       'order_count'       => 142,
     *       'total_qty'         => 168,
     *       'by_day'            => [0 => 12, 1 => 18, …, 6 => 32],   // 0=Sunday
     *       'by_hour'           => [11 => 14, 12 => 38, 13 => 41, …],
     *       'peak_dow'          => 6,
     *       'peak_hour'         => 19,
     *     ],
     *     …
     *   ]
     *
     * `by_day` and `by_hour` arrays only contain non-zero buckets to keep
     * the response payload small for restaurants with sparse traffic.
     *
     * @param  Tenant  $tenant
     * @param  int     $days  Trailing window. Defaults to 30.
     * @return list<array<string, mixed>>
     */
    public function topItemsForRestaurant(Tenant $tenant, int $days = self::DEFAULT_TOP_DAYS): array
    {
        $days = max(1, min($days, 365));
        $rows = $this->aggregateBuckets($tenant->id, $days);

        if ($rows === []) {
            return [];
        }

        $names = $this->loadItemNames(
            $tenant,
            collect($rows)->pluck('menu_item_id')->filter()->unique()->values()->all(),
        );

        return $this->collapseByItem($rows, $names);
    }

    /**
     * Naive next-week prediction.
     *
     * Algorithm:
     *   1. Aggregate qty per (menu_item_id, dow) over the trailing 8 weeks.
     *   2. For each item, compute mean qty per dow.
     *   3. Sum the 7 means matching the upcoming 7 days.
     *
     * The "confidence" is a coarse score based on how many sample weeks
     * contributed to the mean — `weeks_with_sales / 8`. Below 0.25 the
     * estimate is shaky and the caller should annotate it as "low".
     *
     * @return list<array{
     *     menu_item_id: string,
     *     name: string,
     *     predicted_qty_next_week: int,
     *     confidence: float,
     *     by_day_predicted: array<int, int>,
     * }>
     */
    public function predictNextWeek(Tenant $tenant): array
    {
        $samples = $this->weeklySamples($tenant->id, weeks: 8);
        if ($samples === []) {
            return [];
        }

        $byItemDow = [];      // [item_id][dow] = list<int> of qty per week
        foreach ($samples as $row) {
            $itemId = (string) $row['menu_item_id'];
            $dow = (int) $row['dow'];
            $qty = (int) $row['qty'];
            $byItemDow[$itemId][$dow][] = $qty;
        }

        $names = $this->loadItemNames($tenant, array_keys($byItemDow));
        $upcomingDows = $this->upcomingWeekDows();

        $out = [];
        foreach ($byItemDow as $itemId => $dowSamples) {
            $perDay = [];
            $weeksWithSales = 0;
            foreach ($upcomingDows as $dow) {
                $qtyList = $dowSamples[$dow] ?? [];
                $mean = $qtyList === [] ? 0 : (int) round(array_sum($qtyList) / count($qtyList));
                $perDay[$dow] = $mean;
                if ($qtyList !== []) {
                    $weeksWithSales = max($weeksWithSales, count($qtyList));
                }
            }

            $weekTotal = array_sum($perDay);
            if ($weekTotal <= 0) {
                continue;
            }

            $out[] = [
                'menu_item_id' => $itemId,
                'name' => $names[$itemId] ?? '—',
                'predicted_qty_next_week' => $weekTotal,
                'confidence' => round(min($weeksWithSales / 8, 1.0), 2),
                'by_day_predicted' => $perDay,
            ];
        }

        usort($out, static fn ($a, $b) => $b['predicted_qty_next_week'] <=> $a['predicted_qty_next_week']);

        return array_slice($out, 0, 50);
    }

    /**
     * Low-selling items that are candidates for menu retirement.
     *
     * Returns active items with strictly fewer than {@see RETIRE_THRESHOLD}
     * units sold in the trailing window. Inactive / soft-deleted items are
     * excluded — they're already off the menu.
     *
     * @return list<array{
     *     menu_item_id: string,
     *     name: string,
     *     total_qty: int,
     *     last_ordered_at: string|null,
     * }>
     */
    public function lowSellersToRetire(Tenant $tenant, int $days = self::DEFAULT_RETIRE_DAYS): array
    {
        $days = max(7, min($days, 365));
        $since = Carbon::now()->subDays($days);

        // Raw qty + last sale per item.
        $sold = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.tenant_id', $tenant->id)
            ->where('orders.tenant_id', $tenant->id)
            ->where('orders.created_at', '>=', $since)
            ->whereNotIn('orders.status', self::EXCLUDED_STATUSES)
            ->whereNotNull('order_items.menu_item_id')
            ->selectRaw('
                order_items.menu_item_id,
                SUM(order_items.quantity) AS total_qty,
                MAX(orders.created_at) AS last_ordered_at
            ')
            ->groupBy('order_items.menu_item_id')
            ->get()
            ->keyBy('menu_item_id');

        // Pull every active item — items with zero sales must still be flagged.
        $activeItems = MenuItem::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        $out = [];
        foreach ($activeItems as $item) {
            $row = $sold->get($item->id);
            $qty = $row !== null ? (int) $row->total_qty : 0;
            if ($qty >= self::RETIRE_THRESHOLD) {
                continue;
            }
            $out[] = [
                'menu_item_id' => (string) $item->id,
                'name' => $this->localizedName($item),
                'total_qty' => $qty,
                'last_ordered_at' => $row !== null && $row->last_ordered_at !== null
                    ? Carbon::parse($row->last_ordered_at)->toIso8601String()
                    : null,
            ];
        }

        usort($out, static fn ($a, $b) => $a['total_qty'] <=> $b['total_qty']);

        return array_slice($out, 0, 50);
    }

    // ---- helpers ----------------------------------------------------------

    /**
     * Returns rows shaped { menu_item_id, order_count, total_qty, dow, hour }.
     *
     * @return list<array<string, mixed>>
     */
    private function aggregateBuckets(string $tenantId, int $days): array
    {
        $since = Carbon::now()->subDays($days);

        $driver = DB::connection()->getDriverName();
        // Postgres: EXTRACT(DOW)=0..6 (Sun..Sat). MySQL: DAYOFWEEK=1..7 (Sun..Sat).
        // Subtract 1 in MySQL to keep the Mon-aligned business semantics consistent.
        $dowExpr = $driver === 'pgsql'
            ? 'EXTRACT(DOW FROM orders.created_at)::int'
            : '(DAYOFWEEK(orders.created_at) - 1)';
        $hourExpr = $driver === 'pgsql'
            ? 'EXTRACT(HOUR FROM orders.created_at)::int'
            : 'HOUR(orders.created_at)';

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.tenant_id', $tenantId)
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.created_at', '>=', $since)
            ->whereNotIn('orders.status', self::EXCLUDED_STATUSES)
            ->whereNotNull('order_items.menu_item_id')
            ->selectRaw("
                order_items.menu_item_id AS menu_item_id,
                COUNT(*) AS order_count,
                SUM(order_items.quantity) AS total_qty,
                {$dowExpr} AS dow,
                {$hourExpr} AS hour
            ")
            ->groupBy('order_items.menu_item_id', 'dow', 'hour')
            ->orderByDesc('order_count')
            ->limit(2000)
            ->get();

        return $rows->map(static fn ($row) => (array) $row)->all();
    }

    /**
     * Collapse the (item, dow, hour) buckets into one row per item with
     * top-level totals + per-day / per-hour breakdowns.
     *
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, string>       $names
     * @return list<array<string, mixed>>
     */
    private function collapseByItem(array $rows, array $names): array
    {
        $byItem = [];
        foreach ($rows as $row) {
            $itemId = (string) $row['menu_item_id'];
            $itemId === '' && $itemId = '—';

            $byItem[$itemId] ??= [
                'menu_item_id' => $itemId,
                'name' => $names[$itemId] ?? '—',
                'order_count' => 0,
                'total_qty' => 0,
                'by_day' => [],
                'by_hour' => [],
            ];
            $byItem[$itemId]['order_count'] += (int) $row['order_count'];
            $byItem[$itemId]['total_qty'] += (int) $row['total_qty'];

            $dow = (int) $row['dow'];
            $hour = (int) $row['hour'];
            $byItem[$itemId]['by_day'][$dow] = ($byItem[$itemId]['by_day'][$dow] ?? 0) + (int) $row['total_qty'];
            $byItem[$itemId]['by_hour'][$hour] = ($byItem[$itemId]['by_hour'][$hour] ?? 0) + (int) $row['total_qty'];
        }

        foreach ($byItem as &$entry) {
            $entry['peak_dow'] = $this->argmax($entry['by_day']);
            $entry['peak_hour'] = $this->argmax($entry['by_hour']);
        }
        unset($entry);

        $list = array_values($byItem);
        usort($list, static fn ($a, $b) => $b['order_count'] <=> $a['order_count']);

        return array_slice($list, 0, 50);
    }

    /**
     * Per-week samples used by predictNextWeek. Returns rows shaped
     * { menu_item_id, dow, week_offset, qty }.
     *
     * @return list<array<string, mixed>>
     */
    private function weeklySamples(string $tenantId, int $weeks): array
    {
        $since = Carbon::now()->subWeeks($weeks);

        $driver = DB::connection()->getDriverName();
        $dowExpr = $driver === 'pgsql'
            ? 'EXTRACT(DOW FROM orders.created_at)::int'
            : '(DAYOFWEEK(orders.created_at) - 1)';
        // Postgres EXTRACT(WEEK) = ISO week (1..53). MySQL WEEK(date, 3) = ISO mode.
        $weekExpr = $driver === 'pgsql'
            ? 'EXTRACT(WEEK FROM orders.created_at)::int'
            : 'WEEK(orders.created_at, 3)';

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.tenant_id', $tenantId)
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.created_at', '>=', $since)
            ->whereNotIn('orders.status', self::EXCLUDED_STATUSES)
            ->whereNotNull('order_items.menu_item_id')
            ->selectRaw("
                order_items.menu_item_id AS menu_item_id,
                {$dowExpr} AS dow,
                {$weekExpr} AS week_offset,
                SUM(order_items.quantity) AS qty
            ")
            ->groupBy('order_items.menu_item_id', 'dow', 'week_offset')
            ->get();

        return $rows->map(static fn ($row) => (array) $row)->all();
    }

    /**
     * Look up a localised name (uz fallback) for a list of menu item ids.
     * Returns `[itemId => name]`. Bypasses the global tenant scope because
     * we already filter by `tenant_id` upstream.
     *
     * @param  list<string>  $itemIds
     * @return array<string, string>
     */
    private function loadItemNames(Tenant $tenant, array $itemIds): array
    {
        if ($itemIds === []) {
            return [];
        }

        $items = MenuItem::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $itemIds)
            ->get(['id', 'name']);

        $out = [];
        foreach ($items as $item) {
            $out[(string) $item->id] = $this->localizedName($item);
        }
        return $out;
    }

    /** Localised display name with uz fallback. */
    private function localizedName(MenuItem $item): string
    {
        $name = $item->name;
        if (is_array($name)) {
            return (string) ($name['uz'] ?? $name['ru'] ?? $name['en'] ?? reset($name) ?: '—');
        }
        return is_string($name) ? $name : '—';
    }

    /**
     * Return the key with the largest numeric value.
     *
     * @param  array<int|string, int|float>  $bucket
     */
    private function argmax(array $bucket): int
    {
        if ($bucket === []) {
            return 0;
        }
        arsort($bucket);
        return (int) array_key_first($bucket);
    }

    /**
     * Day-of-week numbers (PostgreSQL `EXTRACT(DOW)`: Sunday = 0, Saturday = 6)
     * for the upcoming 7 calendar days starting tomorrow.
     *
     * @return list<int>
     */
    private function upcomingWeekDows(): array
    {
        $out = [];
        for ($i = 1; $i <= 7; $i++) {
            $out[] = (int) Carbon::now()->addDays($i)->dayOfWeek;
        }
        return $out;
    }
}
