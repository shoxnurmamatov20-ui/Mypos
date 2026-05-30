<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Warehouse;

use App\Domain\Warehouse\Models\IncomingDocumentItem;
use App\Http\Resources\V1\Inventory\IngredientResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin IncomingDocumentItem
 */
class IncomingDocumentItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'incoming_document_id' => $this->incoming_document_id,
            'ingredient_id' => $this->ingredient_id,
            'ingredient' => IngredientResource::make($this->whenLoaded('ingredient')),
            'quantity' => (float) $this->quantity,
            'unit_price' => $this->unit_price,
            'total_price' => $this->total_price,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'batch_number' => $this->batch_number,
            'notes' => $this->notes,
        ];
    }
}
