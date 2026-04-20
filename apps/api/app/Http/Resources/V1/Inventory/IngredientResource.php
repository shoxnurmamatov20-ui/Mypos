<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Inventory;

use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Ingredient
 */
class IngredientResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => IngredientCategoryResource::make($this->whenLoaded('category')),
            'name' => $this->name,
            'sku' => $this->sku,
            'unit' => $this->unit,
            'cost_per_unit' => $this->cost_per_unit,
            'current_stock' => (float) $this->current_stock,
            'min_stock' => $this->min_stock !== null ? (float) $this->min_stock : null,
            'reorder_point' => $this->reorder_point !== null ? (float) $this->reorder_point : null,
            'is_active' => $this->is_active,
            'low_stock' => $this->isLowStock(),
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
