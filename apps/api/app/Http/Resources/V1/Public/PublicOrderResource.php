<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Public;

use App\Domain\Order\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public order tracker payload — exposes the bare minimum needed for the
 * consumer order tracking screen.
 *
 * IMPORTANT: never expose `order_no` or internal employee/courier identifiers.
 * The tracking_token is the credential — the response should leak as little
 * additional metadata as possible if the token ever lands in logs or shoulder-
 * surfing screenshots.
 *
 * @mixin Order
 */
class PublicOrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $tenant = $this->whenLoaded('tenant');

        return [
            'id' => $this->id,
            'tracking_token' => $this->tracking_token,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,

            'amounts' => [
                'subtotal' => $this->subtotal_amount,
                'tax' => $this->tax_amount,
                'discount' => $this->discount_amount,
                'service_charge' => $this->service_charge_amount,
                'delivery_fee' => $this->delivery_fee_minor,
                'total' => $this->total_amount,
                'paid' => $this->paid_amount,
                'currency' => $this->currency,
            ],

            'restaurant' => $this->whenLoaded('tenant', fn (): array => [
                'slug' => $tenant->slug ?? null,
                'name' => $tenant->name ?? null,
                'logo_url' => $tenant->logo_url ?? null,
                'phone' => $tenant->phone ?? null,
            ]),

            'items' => $this->whenLoaded('items', fn (): array => $this->items->map(fn ($item): array => [
                'id' => $item->id,
                'menu_item_id' => $item->menu_item_id,
                'name' => $item->name_snapshot,
                'price_amount' => $item->price_amount,
                'quantity' => $item->quantity,
                'subtotal_amount' => $item->subtotal_amount,
                'modifiers' => $item->modifiers ?? [],
                'notes' => $item->notes,
                'status' => $item->status,
            ])->all()),

            'eta_minutes' => $this->etaMinutes(),

            'placed_at' => $this->placed_at?->toIso8601String(),
            'prepared_at' => $this->prepared_at?->toIso8601String(),
            'picked_up_at' => $this->picked_up_at?->toIso8601String(),
            'delivering_at' => $this->delivering_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
        ];
    }

    /**
     * Best-effort ETA: how many minutes from "now" we expect delivery.
     * Returns null when the order is already delivered/cancelled.
     */
    private function etaMinutes(): ?int
    {
        if ($this->delivered_at !== null || $this->cancelled_at !== null) {
            return null;
        }

        $tenant = $this->relationLoaded('tenant') ? $this->tenant : null;
        $settings = is_array($tenant?->settings ?? null) ? $tenant->settings : [];
        $marketplace = is_array($settings['marketplace'] ?? null) ? $settings['marketplace'] : [];
        $deliveryMinutes = isset($marketplace['delivery_minutes']) ? (int) $marketplace['delivery_minutes'] : 30;

        $base = $this->placed_at ?? $this->created_at;
        if ($base === null) {
            return $deliveryMinutes;
        }

        $elapsed = (int) $base->diffInMinutes(now(), false);
        $remaining = $deliveryMinutes - $elapsed;

        return $remaining > 0 ? $remaining : 0;
    }
}
