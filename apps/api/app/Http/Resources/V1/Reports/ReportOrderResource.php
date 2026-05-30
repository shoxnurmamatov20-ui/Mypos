<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Reports;

use App\Domain\Order\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lean row shape for the manager-panel Buyurtmalar (orders) report.
 *
 * Mirrors {@see \App\Http\Resources\V1\Order\OrderResource} but without
 * the line items array — the report list page only needs the summary
 * row; users click through for the detail.
 *
 * @mixin Order
 */
class ReportOrderResource extends JsonResource
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
            'guest_count' => $this->guest_count,
            'table' => $this->whenLoaded('table', fn (): ?array => $this->table === null ? null : [
                'id' => (string) $this->table->id,
                'name' => (string) $this->table->name,
            ]),
            'waiter' => $this->whenLoaded('servedBy', fn (): ?array => $this->servedBy === null ? null : [
                'id' => (string) $this->servedBy->id,
                'name' => (string) ($this->servedBy->user?->name ?? '—'),
            ]),
            'customer' => $this->whenLoaded('customer', fn (): ?array => $this->customer === null ? null : [
                'id' => (string) $this->customer->id,
                'name' => $this->customer->fullName(),
            ]),
            'amounts' => [
                'subtotal' => (int) $this->subtotal_amount,
                'tax' => (int) $this->tax_amount,
                'discount' => (int) $this->discount_amount,
                'total' => (int) $this->total_amount,
                'paid' => (int) $this->paid_amount,
                'currency' => (string) $this->currency,
            ],
            'placed_at' => $this->placed_at?->toIso8601String(),
            'served_at' => $this->served_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
