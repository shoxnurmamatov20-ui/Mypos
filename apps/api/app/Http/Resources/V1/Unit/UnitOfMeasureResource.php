<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Unit;

use App\Domain\Unit\Models\UnitOfMeasure;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin UnitOfMeasure
 */
class UnitOfMeasureResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'abbreviation' => $this->abbreviation,
            'type' => $this->type,
            'is_active' => (bool) $this->is_active,
            'sort_order' => (int) $this->sort_order,

            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
