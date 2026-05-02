<?php

declare(strict_types=1);

namespace App\Domain\Employee\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\ShiftBreak;
use App\Models\User;

class ShiftBreakPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->employeeFor($user) !== null;
    }

    public function view(User $user, ShiftBreak $break): bool
    {
        if (! $this->shareTenant($user, $break)) {
            return false;
        }
        if ($this->isAdminOrManager($user)) {
            return true;
        }
        $employee = $this->employeeFor($user);
        return $employee !== null && $break->employee_id === $employee->id;
    }

    /**
     * Breaks are created from the mobile app — Filament panel shouldn't allow creation.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Read-only in admin panel; breaks are managed by the staff app via API actions.
     */
    public function update(User $user, ShiftBreak $break): bool
    {
        return false;
    }

    public function delete(User $user, ShiftBreak $break): bool
    {
        return false;
    }

    public function forceDelete(User $user, ShiftBreak $break): bool
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

    private function shareTenant(User $user, ShiftBreak $break): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $break->tenant_id;
    }
}
