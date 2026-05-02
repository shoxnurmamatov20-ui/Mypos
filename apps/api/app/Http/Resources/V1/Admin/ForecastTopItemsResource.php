<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase-4 — wraps a single row from
 * {@see \App\Domain\AI\Services\DemandForecastService::topItemsForRestaurant()}.
 *
 * The service returns a plain array (we run on the query builder rather
 * than Eloquent so we can avoid the BelongsToTenant scope cost), so this
 * resource simply forwards keys with stable contract names. The dashboard
 * consumes the JSON directly without further transformation.
 */
class ForecastTopItemsResource extends JsonResource
{
    /**
     * @param  array<string, mixed>  $resource
     */
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
            'order_count' => (int) ($row['order_count'] ?? 0),
            'total_qty' => (int) ($row['total_qty'] ?? 0),
            // by_day / by_hour are sparse maps keyed by integer (DOW / hour-of-day).
            'by_day' => $this->normalizeMap($row['by_day'] ?? []),
            'by_hour' => $this->normalizeMap($row['by_hour'] ?? []),
            'peak_dow' => (int) ($row['peak_dow'] ?? 0),
            'peak_hour' => (int) ($row['peak_hour'] ?? 0),
        ];
    }

    /**
     * Coerce both the key (cast to int) and value (cast to int) so the JSON
     * payload is consistent across PostgreSQL → PHP type juggling.
     *
     * @param  mixed  $bucket
     * @return array<int, int>
     */
    private function normalizeMap(mixed $bucket): array
    {
        if (! is_array($bucket)) {
            return [];
        }
        $out = [];
        foreach ($bucket as $key => $value) {
            $out[(int) $key] = (int) $value;
        }
        ksort($out);
        return $out;
    }
}
