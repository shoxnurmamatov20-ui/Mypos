<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Staff\Courier;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps the array result returned by ComputeCourierEarningsAction.
 *
 * The Action already returns a fully-shaped array; this Resource exists
 * to give us a stable place to add formatting if the contract evolves.
 */
class CourierEarningsResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $data */
        $data = is_array($this->resource) ? $this->resource : [];

        return $data;
    }
}
