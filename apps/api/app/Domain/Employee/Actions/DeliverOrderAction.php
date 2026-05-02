<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Events\Order\OrderStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Mark a delivery as delivered to the customer.
 *
 * - Sets delivered_at + completed_at + status = 'completed'.
 * - If a cash receipt amount is supplied and >= total, marks payment paid.
 * - Returns the fresh Order with relations.
 */
class DeliverOrderAction
{
    /**
     * @param  array{received_amount?: int|null, payment_method?: string|null}  $payload
     */
    public function __invoke(Employee $courier, Order $order, array $payload = []): Order
    {
        if ($order->courier_id !== $courier->id) {
            throw ValidationException::withMessages([
                'order' => [__('Bu buyurtma sizga tayinlanmagan')],
            ])->status(403);
        }

        if ($order->type !== 'delivery') {
            throw ValidationException::withMessages([
                'order' => [__('Bu buyurtma yetkazib berish turi emas')],
            ]);
        }

        if ($order->delivered_at !== null) {
            throw ValidationException::withMessages([
                'order' => [__('Buyurtma allaqachon yetkazilgan')],
            ]);
        }

        if ($order->cancelled_at !== null) {
            throw ValidationException::withMessages([
                'order' => [__('Bekor qilingan buyurtmani yetkazib bo\'lmaydi')],
            ]);
        }

        $received = isset($payload['received_amount']) ? (int) $payload['received_amount'] : null;
        $paymentMethod = $payload['payment_method'] ?? null;

        $oldStatus = $order->status;

        $fresh = DB::transaction(function () use ($order, $received, $paymentMethod): Order {
            $now = now();
            $updates = [
                'delivered_at' => $now,
                'completed_at' => $now,
                'status' => OrderStatus::Completed->value,
            ];

            if ($received !== null && $received >= $order->total_amount) {
                $updates['payment_status'] = 'paid';
                $updates['paid_at'] = $now;
                $updates['paid_amount'] = $order->total_amount;
                if ($paymentMethod !== null) {
                    $updates['payment_method'] = $paymentMethod;
                }
            }

            $order->update($updates);

            return $order->fresh(['items', 'courier', 'customer']) ?? $order;
        });

        // Broadcast for customer tracking + dashboard.
        OrderStatusChanged::dispatch($fresh, $oldStatus, OrderStatus::Completed->value);

        return $fresh;
    }
}
