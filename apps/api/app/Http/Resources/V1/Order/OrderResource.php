<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Order;

use App\Domain\Order\Models\Order;
use App\Http\Resources\V1\Table\TableResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
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
            'table_id' => $this->table_id,
            'table' => TableResource::make($this->whenLoaded('table')),
            'customer_id' => $this->customer_id,
            'employee_id' => $this->employee_id,
            'guest_count' => $this->guest_count,
            'amounts' => [
                'subtotal' => $this->subtotal_amount,
                'tax' => $this->tax_amount,
                'discount' => $this->discount_amount,
                'tip' => $this->tip_amount,
                'service_charge' => $this->service_charge_amount,
                'total' => $this->total_amount,
                'paid' => $this->paid_amount,
                'currency' => $this->currency,
            ],
            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'placed_at' => $this->placed_at?->toIso8601String(),
            'prepared_at' => $this->prepared_at?->toIso8601String(),
            'served_at' => $this->served_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
