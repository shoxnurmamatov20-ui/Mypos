<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Clinic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape returned by ListClinicsAction — the action emits a plain array per
 * row, so this resource is a pass-through with a stable contract for clients.
 *
 * @property-read array<string, mixed> $resource
 */
class ClinicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $row */
        $row = $this->resource;

        return $row;
    }
}
