<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Order;

use App\Domain\Order\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrderItem */
class OrderItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'name' => $this->name_snapshot,
            'price_amount' => $this->price_amount,
            'quantity' => $this->quantity,
            'subtotal_amount' => $this->subtotal_amount,
            'currency' => $this->currency,
            'modifiers' => $this->modifiers ?? [],
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
