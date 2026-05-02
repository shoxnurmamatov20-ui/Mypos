<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Staff;

use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Shift */
class ShiftResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $status = ShiftStatus::tryFrom($this->status);
        $worked = $this->workedMinutes();

        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'scheduled_start' => $this->scheduled_start?->toIso8601String(),
            'scheduled_end' => $this->scheduled_end?->toIso8601String(),
            'actual_start' => $this->actual_start?->toIso8601String(),
            'actual_end' => $this->actual_end?->toIso8601String(),
            'worked_minutes' => $worked,
            'status' => [
                'value' => $this->status,
                'label' => $status?->label() ?? $this->status,
            ],
            'notes' => $this->notes,
            'breaks' => ShiftBreakResource::collection($this->whenLoaded('breaks')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
