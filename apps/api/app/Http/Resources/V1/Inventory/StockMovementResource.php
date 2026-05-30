<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Inventory;

use App\Domain\Inventory\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockMovement
 */
class StockMovementResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $reasonEnum = $this->reasonEnum();

        return [
            'id' => $this->id,
            'ingredient_id' => $this->ingredient_id,
            'ingredient' => $this->whenLoaded('ingredient', fn () => [
                'id' => $this->ingredient->id,
                'name' => $this->ingredient->name,
                'unit' => $this->ingredient->unit,
                'cost_per_unit' => (int) $this->ingredient->cost_per_unit,
                'sku' => $this->ingredient->sku,
            ]),
            'delta' => (float) $this->delta,
            'balance_after' => (float) $this->balance_after,
            'reason' => $this->reason,
            'reason_label' => $reasonEnum?->label(),
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'cost_per_unit' => $this->cost_per_unit,
            'notes' => $this->notes,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
