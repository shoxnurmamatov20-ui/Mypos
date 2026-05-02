<?php

declare(strict_types=1);

namespace App\Domain\Employee\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Models\User;

class ShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->employeeFor($user) !== null;
    }

    public function view(User $user, Shift $shift): bool
    {
        if (! $this->shareTenant($user, $shift)) {
            return false;
        }
        if ($this->isAdminOrManager($user)) {
            return true;
        }
        $employee = $this->employeeFor($user);
        return $employee !== null && $shift->employee_id === $employee->id;
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, Shift $shift): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $shift);
    }

    public function delete(User $user, Shift $shift): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $shift);
    }

    public function restore(User $user, Shift $shift): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $shift);
    }

    public function forceDelete(User $user, Shift $shift): bool
    {
        return $user->is_super_admin === true;
    }

    private function employeeFor(User $user): ?Employee
    {
        return Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->first();
    }

    private function isAdminOrManager(User $user): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        $employee = $this->employeeFor($user);
        if ($employee !== null) {
            $role = EmployeeRole::tryFrom($employee->position);
            if ($role?->isManagerial() === true) {
                return true;
            }
        }
        return $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    private function shareTenant(User $user, Shift $shift): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $shift->tenant_id;
    }
}
