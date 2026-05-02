<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Atomically claim a ready delivery order for the given courier.
 *
 * Uses a single conditional UPDATE so two concurrent couriers cannot both
 * win the row — at most one UPDATE will see courier_id NULL.
 *
 * Throws ValidationException with a 409 status when the order is already
 * assigned, not ready, or otherwise ineligible.
 */
class AcceptDeliveryAction
{
    public function __invoke(Employee $courier, Order $order): Order
    {
        return DB::transaction(function () use ($courier, $order): Order {
            // Atomic: only updates if no courier yet AND status is ready AND
            // type is delivery, all scoped to the courier's tenant.
            $updated = Order::query()
                ->whereKey($order->id)
                ->where('tenant_id', $courier->tenant_id)
                ->where('type', 'delivery')
                ->where('status', 'ready')
                ->whereNull('courier_id')
                ->update([
                    'courier_id' => $courier->id,
                    'updated_at' => now(),
                ]);

            if ($updated === 0) {
                throw ValidationException::withMessages([
                    'order' => [__('Buyurtma allaqachon olingan yoki mavjud emas')],
                ])->status(409);
            }

            return $order->fresh(['items', 'courier', 'customer']);
        });
    }
}
