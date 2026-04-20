<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Employee;

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

        $employeeBrief = $this->whenLoaded('employee', function () {
            /** @var \App\Domain\Employee\Models\Employee|null $employee */
            $employee = $this->employee;
            if ($employee === null) {
                return null;
            }
            $user = $employee->relationLoaded('user') ? $employee->user : null;
            return [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'position' => $employee->position,
                'name' => $user?->name,
            ];
        });

        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => $employeeBrief,
            'scheduled_start' => $this->scheduled_start?->toIso8601String(),
            'scheduled_end' => $this->scheduled_end?->toIso8601String(),
            'actual_start' => $this->actual_start?->toIso8601String(),
            'actual_end' => $this->actual_end?->toIso8601String(),
            'status' => [
                'value' => $this->status,
                'label' => $status?->label() ?? $this->status,
                'color' => $status?->color() ?? 'gray',
            ],
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
