<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Table;

use App\Domain\Table\Models\TableCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TableCategory */
class TableCategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'tables_count' => $this->whenCounted('tables'),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
