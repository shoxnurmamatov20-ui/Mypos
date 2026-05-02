<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Output shape for `GET /api/v1/admin/ai/usage`.
 *
 * Wraps the array returned by {@see \App\Domain\AI\Services\AiQuotaGuard::usageSnapshot()}.
 * Field names match the action exactly so the dashboard can render without
 * mapping logic.
 */
class AiUsageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $snapshot */
        $snapshot = (array) $this->resource;

        return [
            'tier' => $snapshot['tier'] ?? 'free',
            'today' => $snapshot['today'] ?? [],
            'month' => $snapshot['month'] ?? [],
        ];
    }
}
