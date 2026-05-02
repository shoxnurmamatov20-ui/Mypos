<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Events\Order\KitchenItemAssigned;
use App\Events\Order\OrderItemStatusChanged;
use App\Events\Order\OrderStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Cook-side single-item state machine.
 *
 * Allowed transitions:
 *   pending    → preparing      (claims item, sets cook_id + started_preparing_at)
 *   preparing  → ready          (sets ready_at + prep_duration_seconds)
 *   ready      → served         (rare — usually waiter does this on the order level)
 *
 * When all items become ready, the order auto-bumps to 'ready'.
 */
class UpdateOrderItemStatusAction
{
    private const ALLOWED = [
        'pending' => ['preparing'],
        'preparing' => ['ready'],
        'ready' => ['served'],
    ];

    public function __invoke(Employee $cook, Order $order, OrderItem $item, string $next): OrderItem
    {
        if ($item->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'item' => [__('Bu element ushbu buyurtmaga tegishli emas')],
            ]);
        }

        $current = $item->status;
        $allowedNext = self::ALLOWED[$current] ?? [];

        if (! in_array($next, $allowedNext, true)) {
            throw ValidationException::withMessages([
                'status' => [__("'{$current}' → '{$next}' o'tishi mumkin emas")],
            ]);
        }

        $oldStatus = $current;

        $fresh = DB::transaction(function () use ($cook, $order, $item, $next): OrderItem {
            $now = now();
            $updates = ['status' => $next];

            if ($next === 'preparing') {
                $updates['cook_id'] = $cook->id;
                $updates['started_preparing_at'] = $now;
            }

            if ($next === 'ready') {
                $updates['ready_at'] = $now;
                if ($item->started_preparing_at !== null) {
                    $updates['prep_duration_seconds'] = max(
                        0,
                        (int) $item->started_preparing_at->diffInSeconds($now),
                    );
                }
            }

            $item->update($updates);

            $this->bumpOrderIfAllReady($order, $next);

            return $item->fresh(['cook.user']) ?? $item;
        });

        // Broadcast generic state-change to KDS + waiter / staff app.
        OrderItemStatusChanged::dispatch($fresh, $oldStatus, $next);

        // Bonus: explicit "claimed by chef" notice so the line sees the row
        // disappear from the unclaimed pool instantly.
        if ($next === 'preparing') {
            KitchenItemAssigned::dispatch($fresh, $cook);
        }

        // If the order was auto-bumped to 'ready' by bumpOrderIfAllReady,
        // emit OrderStatusChanged too so customer-tracking gets a push.
        $orderFresh = $order->fresh();
        if ($orderFresh !== null && $orderFresh->status !== $order->status) {
            OrderStatusChanged::dispatch($orderFresh, $order->status, $orderFresh->status);
        }

        return $fresh;
    }

    /**
     * If every non-cancelled/served item is ready, mark the whole order ready.
     */
    private function bumpOrderIfAllReady(Order $order, string $changedTo): void
    {
        if ($changedTo !== 'ready') {
            return;
        }

        $nonTerminalCount = OrderItem::query()
            ->where('order_id', $order->id)
            ->whereNotIn('status', ['cancelled'])
            ->count();

        $readyOrServedCount = OrderItem::query()
            ->where('order_id', $order->id)
            ->whereIn('status', ['ready', 'served'])
            ->count();

        if ($nonTerminalCount === 0 || $nonTerminalCount !== $readyOrServedCount) {
            return;
        }

        $current = OrderStatus::tryFrom($order->status);
        if ($current === null) {
            return;
        }

        // Allow the natural pending → preparing → ready jump.
        if (in_array($current, [OrderStatus::Pending, OrderStatus::Preparing], true)) {
            $order->update([
                'status' => OrderStatus::Ready->value,
                'prepared_at' => now(),
            ]);
        }
    }
}
