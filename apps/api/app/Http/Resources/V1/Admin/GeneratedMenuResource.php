<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use App\Domain\AI\DataTransferObjects\GeneratedMenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a single {@see GeneratedMenuItem} DTO in the API envelope shape.
 *
 * Use {@see self::collection()} to wrap an array of items.
 *
 * @mixin GeneratedMenuItem
 */
class GeneratedMenuResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var GeneratedMenuItem $item */
        $item = $this->resource;

        return [
            'name' => $item->name,
            'description' => $item->description,
            'category' => $item->category,
            'suggested_price_minor' => $item->suggested_price_minor,
            'emoji' => $item->emoji,
        ];
    }
}
