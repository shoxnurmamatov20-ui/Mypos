<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Staff;

use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact order shape rendered to cooks. Filters out items that are
 * already terminal (cancelled/served) so the kitchen queue stays clean.
 *
 * @mixin Order
 */
class KitchenOrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $tableName = null;
        if ($this->relationLoaded('table') && $this->table !== null) {
            $tableName = $this->table->name;
        }

        $elapsed = max(0, (int) ($this->placed_at ?? $this->created_at)->diffInSeconds(now()));

        $items = $this->relationLoaded('items')
            ? $this->items->reject(fn (OrderItem $i): bool => in_array($i->status, ['served', 'cancelled'], true))
            : collect();

        return [
            'id' => $this->id,
            'order_no' => $this->order_no,
            'table_name' => $tableName,
            'type' => $this->type,
            'status' => $this->status,
            'elapsed_seconds' => $elapsed,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'notes' => $this->notes,
            'items' => $items->map(fn (OrderItem $i): array => $this->formatItem($i))->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function formatItem(OrderItem $item): array
    {
        $cookName = null;
        if ($item->relationLoaded('cook') && $item->cook !== null) {
            $cook = $item->cook;
            $cookName = $cook->relationLoaded('user') && $cook->user !== null
                ? $cook->user->name
                : $cook->employee_code;
        }

        return [
            'id' => $item->id,
            'name' => $item->name_snapshot,
            'quantity' => $item->quantity,
            'status' => $item->status,
            'notes' => $item->notes,
            'modifiers' => $item->modifiers ?? [],
            'started_preparing_at' => $item->started_preparing_at?->toIso8601String(),
            'ready_at' => $item->ready_at?->toIso8601String(),
            'prep_duration_seconds' => $item->prep_duration_seconds,
            'cook_id' => $item->cook_id,
            'cook_name' => $cookName,
        ];
    }
}
