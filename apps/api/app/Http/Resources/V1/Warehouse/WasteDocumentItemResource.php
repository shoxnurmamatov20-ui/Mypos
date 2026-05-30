<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Warehouse;

use App\Domain\Warehouse\Models\WasteDocumentItem;
use App\Http\Resources\V1\Inventory\IngredientResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WasteDocumentItem
 */
class WasteDocumentItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'waste_document_id' => $this->waste_document_id,
            'ingredient_id' => $this->ingredient_id,
            'ingredient' => IngredientResource::make($this->whenLoaded('ingredient')),
            'quantity' => (float) $this->quantity,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $this->total_cost,
            'notes' => $this->notes,
        ];
    }
}
