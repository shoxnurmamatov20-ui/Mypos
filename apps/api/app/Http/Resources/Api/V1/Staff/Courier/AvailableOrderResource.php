<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Staff\Courier;

use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact "available delivery" payload shown on the courier marketplace
 * screen. The mobile app uses this to populate delivery cards.
 *
 * @mixin Order
 */
class AvailableOrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items : collect();

        $itemsCount = (int) $items->sum('quantity');
        $itemsPreview = $items->take(3)
            ->map(fn (OrderItem $i): string => $i->quantity . 'x ' . $i->name_snapshot)
            ->values()
            ->all();

        $readyAt = $this->prepared_at ?? $this->updated_at;
        $elapsed = $readyAt !== null
            ? max(0, (int) $readyAt->diffInSeconds(now()))
            : 0;

        $customerName = null;
        $customerPhone = $this->delivery_phone;
        if ($this->relationLoaded('customer') && $this->customer !== null) {
            $customerName = $this->customer->fullName();
            $customerPhone = $customerPhone ?? $this->customer->phone;
        }

        return [
            'id' => $this->id,
            'order_no' => $this->order_no,
            'customer_name' => $customerName,
            'customer_phone' => $customerPhone,
            'delivery_address' => $this->delivery_address,
            'delivery_notes' => $this->delivery_notes,
            'items_count' => $itemsCount,
            'items_preview' => $itemsPreview,
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'delivery_fee_minor' => $this->delivery_fee_minor,
            'courier_earnings_minor' => $this->courier_earnings_minor,
            'estimated_distance_meters' => $this->delivery_distance_meters,
            'ready_at' => $readyAt?->toIso8601String(),
            'elapsed_since_ready_seconds' => $elapsed,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
        ];
    }
}
