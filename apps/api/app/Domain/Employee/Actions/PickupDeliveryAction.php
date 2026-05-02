<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use Illuminate\Validation\ValidationException;

/**
 * Marks a delivery as physically picked up from the restaurant. The order's
 * `status` stays at `ready` — the mobile app derives the UI state from
 * picked_up_at / delivered_at timestamps. This keeps the existing kitchen
 * state machine untouched.
 */
class PickupDeliveryAction
{
    public function __invoke(Employee $courier, Order $order): Order
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

        if ($order->picked_up_at !== null) {
            throw ValidationException::withMessages([
                'order' => [__('Buyurtma allaqachon olib ketilgan')],
            ]);
        }

        if ($order->delivered_at !== null || $order->cancelled_at !== null) {
            throw ValidationException::withMessages([
                'order' => [__('Buyurtma allaqachon yopilgan')],
            ]);
        }

        $now = now();
        $order->update([
            'picked_up_at' => $now,
            'delivering_at' => $now,
        ]);

        return $order->fresh(['items', 'courier', 'customer']);
    }
}
