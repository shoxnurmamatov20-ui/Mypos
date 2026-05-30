<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Warehouse;

use App\Domain\Warehouse\Models\IncomingDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin IncomingDocument
 */
class IncomingDocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'doc_no' => $this->doc_no,
            'doc_date' => $this->doc_date->toDateString(),
            'supplier_name' => $this->supplier_name,
            'supplier_inn' => $this->supplier_inn,
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'status_label' => $this->statusEnum()?->label(),
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', function (): ?array {
                /** @var User|null $user */
                $user = $this->creator;

                return $user !== null
                    ? ['id' => $user->id, 'name' => $user->name]
                    : null;
            }),
            'items' => IncomingDocumentItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
