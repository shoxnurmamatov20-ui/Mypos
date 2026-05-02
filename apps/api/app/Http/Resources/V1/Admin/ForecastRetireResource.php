<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase-4 — wraps a row from
 * {@see \App\Domain\AI\Services\DemandForecastService::lowSellersToRetire()}.
 */
class ForecastRetireResource extends JsonResource
{
    /** @param array<string, mixed> $resource */
    public function __construct(array $resource)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $row = (array) $this->resource;

        return [
            'menu_item_id' => (string) ($row['menu_item_id'] ?? ''),
            'name' => (string) ($row['name'] ?? '—'),
            'total_qty' => (int) ($row['total_qty'] ?? 0),
            // Last sale instant in ISO-8601 — null indicates the item has
            // never been ordered in the analysis window.
            'last_ordered_at' => isset($row['last_ordered_at']) && is_string($row['last_ordered_at'])
                ? $row['last_ordered_at']
                : null,
        ];
    }
}
