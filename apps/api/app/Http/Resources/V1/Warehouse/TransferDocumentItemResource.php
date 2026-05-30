<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Warehouse;

use App\Domain\Warehouse\Models\TransferDocumentItem;
use App\Http\Resources\V1\Inventory\IngredientResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TransferDocumentItem
 */
class TransferDocumentItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transfer_document_id' => $this->transfer_document_id,
            'ingredient_id' => $this->ingredient_id,
            'ingredient' => IngredientResource::make($this->whenLoaded('ingredient')),
            'quantity' => (float) $this->quantity,
            'notes' => $this->notes,
        ];
    }
}
