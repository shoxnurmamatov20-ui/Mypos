<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Employee\Models\Shift;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Payment\Models\Payment;
use Illuminate\Support\Carbon;

/**
 * Z-Report — daily close summary.
 *
 * Replaces the legacy print-roll "Z отчёт" cashiers used to take off the POS
 * terminal at end of day. Pure read-only aggregation; no state mutation.
 * One service call = ~9 small grouped queries against tenant-scoped models,
 * each sub-millisecond on indexed columns.
 */
final class ZReportService
{
    /** @return array<string, mixed> */
    public function generate(Carbon $date): array
    {
        $from = $date->copy()->startOfDay();
        $to = $date->copy()->endOfDay();

        return [
            'date' => $date->toDateString(),
            'totals' => $this->totals($from, $to),
            'by_status' => $this->byStatus($from, $to),
            'by_type' => $this->byType($from, $to),
            'payments' => $this->payments($from, $to),
            'top_items' => $this->topItems($from, $to),
            'top_waiters' => $this->topWaiters($from, $to),
            'cancellations' => $this->cancellations($from, $to),
            'shifts' => $this->shifts($from, $to),
        ];
    }

    /** @return array<string, int> */
    private function totals(Carbon $from, Carbon $to): array
    {
        $row = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled', 'refunded'])
            ->selectRaw(
                'COUNT(*) AS orders_count,
                 COALESCE(SUM(total_amount), 0) AS revenue,
                 COALESCE(SUM(tax_amount), 0) AS tax,
                 COALESCE(SUM(discount_amount), 0) AS discount'
            )
            ->first();

        $count = (int) ($row->orders_count ?? 0);
        $revenue = (int) ($row->revenue ?? 0);
        $tax = (int) ($row->tax ?? 0);
        $discount = (int) ($row->discount ?? 0);

        return [
            'orders_count' => $count,
            'revenue_minor' => $revenue,
            'tax_minor' => $tax,
            'discount_minor' => $discount,
            'net_revenue_minor' => $revenue - $tax,
            'avg_ticket_minor' => $count > 0 ? (int) round($revenue / $count) : 0,
        ];
    }

    /** @return array<string, int> */
    private function byStatus(Carbon $from, Carbon $to): array
    {
        $defaults = [
            'completed' => 0,
            'served' => 0,
            'ready' => 0,
            'preparing' => 0,
            'pending' => 0,
            'cancelled' => 0,
            'refunded' => 0,
        ];

        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('status, COUNT(*) AS cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->all();

        foreach ($rows as $status => $cnt) {
            if (array_key_exists((string) $status, $defaults)) {
                $defaults[(string) $status] = (int) $cnt;
            }
        }

        return $defaults;
    }

    /** @return array<string, array{count: int, revenue_minor: int}> */
    private function byType(Carbon $from, Carbon $to): array
    {
        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled', 'refunded'])
            ->selectRaw('type, COUNT(*) AS cnt, COALESCE(SUM(total_amount), 0) AS revenue')
            ->groupBy('type')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $out[(string) $row->type] = [
                'count' => (int) $row->cnt,
                'revenue_minor' => (int) $row->revenue,
            ];
        }
        return $out;
    }

    /** @return list<array{provider: string, count: int, amount_minor: int, percent: float}> */
    private function payments(Carbon $from, Carbon $to): array
    {
        $rows = Payment::query()
            ->whereBetween('payments.created_at', [$from, $to])
            ->where('status', 'captured')
            ->selectRaw('provider, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS amount')
            ->groupBy('provider')
            ->get();

        $total = (int) $rows->sum('amount');

        return $rows->map(function ($row) use ($total): array {
            $amount = (int) $row->amount;
            return [
                'provider' => (string) $row->provider,
                'count' => (int) $row->cnt,
                'amount_minor' => $amount,
                'percent' => $total > 0 ? round(($amount / $total) * 100, 2) : 0.0,
            ];
        })->all();
    }

    /** @return list<array{menu_item_id: string|null, name: string, quantity_sold: float, revenue_minor: int}> */
    private function topItems(Carbon $from, Carbon $to): array
    {
        $rows = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$from, $to])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->where('order_items.status', '!=', 'cancelled')
            ->selectRaw(
                'order_items.menu_item_id,
                 MAX(order_items.name_snapshot) AS name,
                 COALESCE(SUM(order_items.quantity), 0) AS qty,
                 COALESCE(SUM(order_items.subtotal_amount), 0) AS revenue'
            )
            ->groupBy('order_items.menu_item_id')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return $rows->map(fn ($r): array => [
            'menu_item_id' => $r->menu_item_id !== null ? (string) $r->menu_item_id : null,
            'name' => (string) ($r->name ?? ''),
            'quantity_sold' => (float) $r->qty,
            'revenue_minor' => (int) $r->revenue,
        ])->all();
    }

    /** @return list<array{employee_id: string|null, name: string, orders_count: int, revenue_minor: int}> */
    private function topWaiters(Carbon $from, Carbon $to): array
    {
        $rows = Order::query()
            ->from('orders')
            ->leftJoin('employees', 'orders.served_by_id', '=', 'employees.id')
            ->leftJoin('users', 'employees.user_uuid', '=', 'users.uuid')
            ->whereBetween('orders.created_at', [$from, $to])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->whereNotNull('orders.served_by_id')
            ->selectRaw(
                'orders.served_by_id AS employee_id,
                 MAX(users.name) AS name,
                 COUNT(*) AS cnt,
                 COALESCE(SUM(orders.total_amount), 0) AS revenue'
            )
            ->groupBy('orders.served_by_id')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return $rows->map(fn ($r): array => [
            'employee_id' => $r->employee_id !== null ? (string) $r->employee_id : null,
            'name' => (string) ($r->name ?? '—'),
            'orders_count' => (int) $r->cnt,
            'revenue_minor' => (int) $r->revenue,
        ])->all();
    }

    /** @return array<string, mixed> */
    private function cancellations(Carbon $from, Carbon $to): array
    {
        // The schema does not store an explicit cancel reason — we group by
        // the `notes` text instead (truncated). Empty notes collapse into
        // a single "Sabab ko'rsatilmagan" bucket so the chart isn't dominated
        // by an unlabelled slice.
        // Top-20 cap protects memory under tenants with many unique free-text
        // notes; sorted by count so the most common reasons surface first.
        $orders = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'cancelled')
            ->selectRaw(
                "COUNT(*) AS cnt,
                 COALESCE(SUM(total_amount), 0) AS loss,
                 COALESCE(NULLIF(TRIM(notes), ''), 'Sabab ko''rsatilmagan') AS reason"
            )
            ->groupBy('reason')
            ->orderByDesc('cnt')
            ->limit(20)
            ->get();

        $count = (int) $orders->sum('cnt');
        $loss = (int) $orders->sum('loss');

        $reasons = $orders
            ->map(fn ($r): array => [
                'reason' => (string) $r->reason,
                'count' => (int) $r->cnt,
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        return [
            'count' => $count,
            'reasons' => $reasons,
            'estimated_loss_minor' => $loss,
        ];
    }

    /** @return array{open_count: int, closed_count: int} */
    private function shifts(Carbon $from, Carbon $to): array
    {
        $rows = Shift::query()
            ->where(function ($q) use ($from, $to): void {
                $q->whereBetween('actual_start', [$from, $to])
                    ->orWhereBetween('scheduled_start', [$from, $to]);
            })
            ->selectRaw('status, COUNT(*) AS cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->all();

        $open = 0;
        $closed = 0;
        foreach ($rows as $status => $cnt) {
            if (in_array((string) $status, ['in_progress', 'active', 'open', 'scheduled'], true)) {
                $open += (int) $cnt;
            } elseif (in_array((string) $status, ['completed', 'closed', 'ended'], true)) {
                $closed += (int) $cnt;
            }
        }

        return ['open_count' => $open, 'closed_count' => $closed];
    }
}
