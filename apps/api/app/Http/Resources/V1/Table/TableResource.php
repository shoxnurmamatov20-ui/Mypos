<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Table;

use App\Domain\Table\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Table */
class TableResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'capacity' => $this->capacity,
            'status' => $this->status,
            'shape' => $this->shape,
            'position_x' => $this->position_x,
            'position_y' => $this->position_y,
            'width' => $this->width,
            'height' => $this->height,
            'qr_code' => $this->qr_code,
            'category_id' => $this->category_id,
            'category' => TableCategoryResource::make($this->whenLoaded('category')),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
