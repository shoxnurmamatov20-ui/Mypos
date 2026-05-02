<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Staff;

use App\Domain\Employee\Enums\BreakReason;
use App\Domain\Employee\Models\ShiftBreak;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ShiftBreak */
class ShiftBreakResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $reason = $this->reason !== null ? BreakReason::tryFrom($this->reason) : null;

        return [
            'id' => $this->id,
            'shift_id' => $this->shift_id,
            'employee_id' => $this->employee_id,
            'started_at' => $this->started_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'is_open' => $this->isOpen(),
            'reason' => $this->reason === null ? null : [
                'value' => $this->reason,
                'label' => $reason?->label() ?? $this->reason,
            ],
            'notes' => $this->notes,
        ];
    }
}
