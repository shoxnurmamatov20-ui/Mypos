<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Inventory;

use App\Domain\Inventory\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Recipe
 */
class RecipeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'ingredient_id' => $this->ingredient_id,
            'ingredient' => IngredientResource::make($this->whenLoaded('ingredient')),
            'quantity' => (float) $this->quantity,
            'unit' => $this->unit,
            'is_optional' => $this->is_optional,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
