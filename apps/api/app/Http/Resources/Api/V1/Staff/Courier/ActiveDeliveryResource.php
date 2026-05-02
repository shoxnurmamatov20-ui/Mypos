<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Staff\Courier;

use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full payload for the courier's currently active delivery — items, address,
 * customer, and a `derived_state` helper so the mobile app does not need to
 * duplicate the timestamp logic.
 *
 * @mixin Order
 */
class ActiveDeliveryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items : collect();

        $customer = null;
        if ($this->relationLoaded('customer') && $this->customer !== null) {
            $customer = [
                'id' => $this->customer->id,
                'name' => $this->customer->fullName(),
                'phone' => $this->customer->phone,
            ];
        }

        return [
            'id' => $this->id,
            'order_no' => $this->order_no,
            'status' => $this->status,
            'derived_state' => $this->deriveCourierState(),
            'customer' => $customer,
            'delivery_address' => $this->delivery_address,
            'delivery_phone' => $this->delivery_phone,
            'delivery_notes' => $this->delivery_notes,
            'items' => $items->map(fn (OrderItem $i): array => [
                'id' => $i->id,
                'name' => $i->name_snapshot,
                'quantity' => $i->quantity,
                'modifiers' => $i->modifiers ?? [],
                'notes' => $i->notes,
            ])->values()->all(),
            'amounts' => [
                'subtotal' => $this->subtotal_amount,
                'total' => $this->total_amount,
                'paid' => $this->paid_amount,
                'currency' => $this->currency,
                'delivery_fee_minor' => $this->delivery_fee_minor,
                'courier_earnings_minor' => $this->courier_earnings_minor,
            ],
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'distance_meters' => $this->delivery_distance_meters,
            'timestamps' => [
                'placed_at' => $this->placed_at?->toIso8601String(),
                'prepared_at' => $this->prepared_at?->toIso8601String(),
                'picked_up_at' => $this->picked_up_at?->toIso8601String(),
                'delivering_at' => $this->delivering_at?->toIso8601String(),
                'delivered_at' => $this->delivered_at?->toIso8601String(),
                'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            ],
        ];
    }

    /**
     * Derive a UI-friendly state from timestamps. Order.status stays at
     * `ready` until delivery completes, so the app needs this hint.
     */
    private function deriveCourierState(): string
    {
        if ($this->cancelled_at !== null) {
            return 'cancelled';
        }
        if ($this->delivered_at !== null) {
            return 'delivered';
        }
        if ($this->picked_up_at !== null) {
            return 'delivering';
        }
        return 'awaiting_pickup';
    }
}
