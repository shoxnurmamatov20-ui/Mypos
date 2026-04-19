<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Menu;

use App\Domain\Menu\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MenuItem
 */
class MenuItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => MenuCategoryResource::make($this->whenLoaded('category')),
            'name' => $this->name,
            'description' => $this->description,
            'slug' => $this->slug,
            'sku' => $this->sku,

            'price' => [
                'amount' => $this->price_amount,
                'currency' => $this->price_currency,
                'effective_amount' => $this->effectivePrice(),
            ],
            'cost_amount' => $this->cost_amount,

            'image_url' => $this->image_url,
            'thumbnail_url' => $this->thumbnail_url,

            'allergens' => $this->allergens ?? [],
            'tags' => $this->tags ?? [],
            'calories' => $this->calories,
            'preparation_minutes' => $this->preparation_minutes,

            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'is_new' => $this->is_new,
            'has_discount' => $this->has_discount,
            'discount_percent' => $this->discount_percent,

            'stock_tracked' => $this->stock_tracked,
            'current_stock' => $this->current_stock,
            'low_stock_threshold' => $this->low_stock_threshold,

            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
