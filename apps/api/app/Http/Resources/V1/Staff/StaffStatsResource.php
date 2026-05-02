<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Staff;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a plain stats array for consistent envelope shaping.
 */
class StaffStatsResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $payload */
        $payload = (array) $this->resource;

        return $payload;
    }
}
