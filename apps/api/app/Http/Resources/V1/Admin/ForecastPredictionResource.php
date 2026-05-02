<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase-4 — wraps a row from
 * {@see \App\Domain\AI\Services\DemandForecastService::predictNextWeek()}.
 */
class ForecastPredictionResource extends JsonResource
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
            'predicted_qty_next_week' => (int) ($row['predicted_qty_next_week'] ?? 0),
            // Confidence is a 0..1 float — cast through float to avoid string
            // serialisation surprises on Postgres/PHP boundaries.
            'confidence' => (float) ($row['confidence'] ?? 0),
            'by_day_predicted' => $this->normalizeMap($row['by_day_predicted'] ?? []),
        ];
    }

    /**
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
