<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Employee;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Employee */
class EmployeeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $status = EmployeeStatus::tryFrom($this->status);
        $position = Role::tryFrom($this->position);

        $latestShift = $this->whenLoaded('latestShift', function () {
            /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Domain\Employee\Models\Shift> $collection */
            $collection = $this->latestShift;
            $shift = $collection->first();
            return $shift === null ? null : ShiftResource::make($shift);
        });

        $user = $this->whenLoaded('user', function () {
            /** @var \App\Models\User|null $u */
            $u = $this->user;
            if ($u === null) {
                return null;
            }
            return [
                'uuid' => $u->uuid,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'locale' => $u->locale,
                'avatar_url' => $u->avatar_url,
            ];
        });

        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'user' => $user,
            'position' => [
                'value' => $this->position,
                'label' => $position?->label() ?? $this->position,
            ],
            'hire_date' => $this->hire_date?->toDateString(),
            'status' => [
                'value' => $this->status,
                'label' => $status?->label() ?? $this->status,
                'color' => $status?->color() ?? 'gray',
            ],
            'base_salary' => $this->base_salary,
            'hourly_rate' => $this->hourly_rate,
            'terminated_at' => $this->terminated_at?->toIso8601String(),
            'notes' => $this->notes,
            'emergency_contact' => $this->emergency_contact,
            'documents' => $this->documents ?? [],
            'latest_shift' => $latestShift,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
