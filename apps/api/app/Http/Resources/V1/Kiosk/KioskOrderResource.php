<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Kiosk;

use App\Domain\Order\Models\Order;
use App\Http\Resources\V1\Order\OrderItemResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Kiosk-flavoured order payload. Strips internal/staff-only fields like
 * employee_id and exposes the kiosk session id so the device can reconcile
 * its local state on a status poll.
 *
 * @mixin Order
 */
class KioskOrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_no' => $this->order_no,
            'type' => $this->type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'kiosk_device_id' => $this->kiosk_device_id,
            'kiosk_session_id' => $this->kiosk_session_id,
            'customer_phone_for_receipt' => $this->customer_phone_for_receipt,
            'amounts' => [
                'subtotal' => (int) $this->subtotal_amount,
                'tax' => (int) $this->tax_amount,
                'discount' => (int) $this->discount_amount,
                'service_charge' => (int) $this->service_charge_amount,
                'total' => (int) $this->total_amount,
                'paid' => (int) $this->paid_amount,
                'currency' => $this->currency,
            ],
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'notes' => $this->notes,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'prepared_at' => $this->prepared_at?->toIso8601String(),
            'served_at' => $this->served_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
