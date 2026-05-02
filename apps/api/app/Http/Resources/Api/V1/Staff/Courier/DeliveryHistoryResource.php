<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Staff\Courier;

use App\Domain\Order\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact past-delivery row for the courier history screen.
 *
 * @mixin Order
 */
class DeliveryHistoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $durationSeconds = null;
        if ($this->picked_up_at !== null && $this->delivered_at !== null) {
            $durationSeconds = max(0, (int) $this->picked_up_at->diffInSeconds($this->delivered_at));
        }

        $customerName = null;
        if ($this->relationLoaded('customer') && $this->customer !== null) {
            $customerName = $this->customer->fullName();
        }

        return [
            'id' => $this->id,
            'order_no' => $this->order_no,
            'customer_name' => $customerName,
            'delivery_address' => $this->delivery_address,
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'courier_earnings_minor' => $this->courier_earnings_minor,
            'delivery_fee_minor' => $this->delivery_fee_minor,
            'distance_meters' => $this->delivery_distance_meters,
            'duration_seconds' => $durationSeconds,
            'tip_minor' => $this->tip_amount,
            'picked_up_at' => $this->picked_up_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
        ];
    }
}
