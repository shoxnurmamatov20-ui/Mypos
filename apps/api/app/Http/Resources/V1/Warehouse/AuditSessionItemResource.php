<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Warehouse;

use App\Domain\Warehouse\Models\AuditSessionItem;
use App\Http\Resources\V1\Inventory\IngredientResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AuditSessionItem
 */
class AuditSessionItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'audit_session_id' => $this->audit_session_id,
            'ingredient_id' => $this->ingredient_id,
            'ingredient' => IngredientResource::make($this->whenLoaded('ingredient')),
            'expected_quantity' => (float) $this->expected_quantity,
            'actual_quantity' => $this->actual_quantity !== null ? (float) $this->actual_quantity : null,
            'discrepancy' => (float) $this->discrepancy,
            'notes' => $this->notes,
        ];
    }
}
