<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Staff;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff-mobile-shaped employee payload (different from admin EmployeeResource).
 *
 * @mixin Employee
 */
class EmployeeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $role = EmployeeRole::tryFrom($this->position);
        $status = EmployeeStatus::tryFrom($this->status);

        $user = $this->whenLoaded('user', function () {
            /** @var \App\Models\User|null $u */
            $u = $this->user;
            if ($u === null) {
                return null;
            }
            return [
                'id' => $u->uuid,
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
            'role' => [
                'value' => $this->position,
                'label' => $role?->label() ?? $this->position,
                'is_kitchen' => $role?->isKitchen() ?? false,
                'is_floor' => $role?->isFloor() ?? false,
                'is_managerial' => $role?->isManagerial() ?? false,
            ],
            'hire_date' => $this->hire_date?->toDateString(),
            'hourly_rate' => $this->hourly_rate,
            'status' => [
                'value' => $this->status,
                'label' => $status?->label() ?? $this->status,
            ],
            'last_clock_in_at' => $this->last_clock_in_at?->toIso8601String(),
            'pin_set_at' => $this->pin_set_at?->toIso8601String(),
            'user' => $user,
        ];
    }
}
