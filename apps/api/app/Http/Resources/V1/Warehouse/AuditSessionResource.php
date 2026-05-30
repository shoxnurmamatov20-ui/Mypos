<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Warehouse;

use App\Domain\Warehouse\Models\AuditSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AuditSession
 */
class AuditSessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'doc_no' => $this->doc_no,
            'started_at' => $this->started_at->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'conducted_by' => $this->conducted_by,
            'conductor' => $this->whenLoaded('conductor', function (): ?array {
                /** @var User|null $user */
                $user = $this->conductor;

                return $user !== null
                    ? ['id' => $user->id, 'name' => $user->name]
                    : null;
            }),
            'status' => $this->status,
            'status_label' => $this->statusEnum()?->label(),
            'discrepancy_count' => $this->discrepancy_count,
            'notes' => $this->notes,
            'items' => AuditSessionItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
