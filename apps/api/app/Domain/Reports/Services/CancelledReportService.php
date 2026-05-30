<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;
use Illuminate\Support\Carbon;

/**
 * Cancellations report. Returns three views: cancelled orders, cancelled
 * line items, and a per-reason rollup. The "reason" comes from the order's
 * `notes` field (no dedicated cancel_reason column exists yet); empty notes
 * collapse into a single "Sabab ko'rsatilmagan" bucket.
 */
final class CancelledReportService
{
    use NormalizesDateRange;

    private const UNSPECIFIED = "Sabab ko'rsatilmagan";

    /** @return array{data: array<string, mixed>} */
    public function generate(?string $from, ?string $to): array
    {
        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);

        $orders = $this->cancelledOrders($fromCarbon, $toCarbon);
        $items = $this->cancelledItems($fromCarbon, $toCarbon);
        $byReason = $this->byReason($orders);

        $orderRows = $orders->map(fn ($order): array => [
            'order_id' => (string) $order->id,
            'order_no' => (string) $order->order_no,
            'table_name' => $order->table?->name,
            'waiter_name' => $order->servedBy?->user?->name,
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->normaliseReason($order->notes),
            'total_minor' => (int) $order->total_amount,
            'items_count' => (int) ($order->items_count ?? 0),
        ])->values()->all();

        $itemRows = $items->map(fn ($r): array => [
            'order_id' => (string) $r->order_id,
            'order_no' => (string) ($r->order_no ?? ''),
            'menu_item_name' => (string) ($r->name_snapshot ?? ''),
            'quantity' => (float) $r->quantity,
            'unit_price_minor' => (int) $r->price_amount,
            'total_loss_minor' => (int) $r->subtotal_amount,
            'cancel_reason' => $this->normaliseReason($r->notes),
        ])->values()->all();

        return [
            'data' => [
                'orders' => $orderRows,
                'items' => $itemRows,
                'summary' => [
                    'orders_count' => count($orderRows),
                    'items_count' => count($itemRows),
                    'total_loss_minor' => (int) (
                        array_sum(array_column($orderRows, 'total_minor'))
                        + array_sum(array_column($itemRows, 'total_loss_minor'))
                    ),
                ],
                'by_reason' => $byReason,
            ],
        ];
    }

    private function cancelledOrders(Carbon $from, Carbon $to): \Illuminate\Database\Eloquent\Collection
    {
        return Order::query()
            ->withCount('items')
            ->with(['table', 'servedBy.user'])
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'cancelled')
            ->orderByDesc('cancelled_at')
            ->limit(500)
            ->get();
    }

    private function cancelledItems(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        // Only fetch items cancelled WITHIN an otherwise-active order. Items
        // cancelled as part of a fully-cancelled order are already counted in
        // the orders bucket (their parent order's `total_amount` includes
        // them); double-counting them here would inflate `total_loss_minor`.
        return OrderItem::query()
            ->from('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$from, $to])
            ->where('order_items.status', 'cancelled')
            ->where('orders.status', '!=', 'cancelled')
            ->selectRaw(
                'order_items.id,
                 order_items.order_id,
                 orders.order_no,
                 order_items.name_snapshot,
                 order_items.quantity,
                 order_items.price_amount,
                 order_items.subtotal_amount,
                 order_items.notes'
            )
            ->limit(500)
            ->get();
    }

    /**
     * @param \Illuminate\Database\Eloquent\Collection<int, Order> $orders
     * @return list<array{reason: string, count: int, loss_minor: int}>
     */
    private function byReason(\Illuminate\Database\Eloquent\Collection $orders): array
    {
        $bucket = [];
        foreach ($orders as $order) {
            $reason = $this->normaliseReason($order->notes);
            if (! isset($bucket[$reason])) {
                $bucket[$reason] = ['reason' => $reason, 'count' => 0, 'loss_minor' => 0];
            }
            $bucket[$reason]['count']++;
            $bucket[$reason]['loss_minor'] += (int) $order->total_amount;
        }

        $rows = array_values($bucket);
        usort($rows, fn (array $a, array $b): int => $b['count'] <=> $a['count']);
        return $rows;
    }

    private function normaliseReason(?string $raw): string
    {
        $trimmed = $raw !== null ? trim($raw) : '';
        return $trimmed === '' ? self::UNSPECIFIED : $trimmed;
    }
}
