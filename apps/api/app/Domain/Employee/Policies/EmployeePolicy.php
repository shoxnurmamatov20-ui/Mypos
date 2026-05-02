<?php

declare(strict_types=1);

namespace App\Domain\Employee\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EmployeePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function view(User $user, Employee $employee): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $employee);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, Employee $employee): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $employee);
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $employee);
    }

    public function restore(User $user, Employee $employee): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $employee);
    }

    public function forceDelete(User $user, Employee $employee): bool
    {
        return $user->is_super_admin === true;
    }

    public function resetPin(User $user, Employee $employee): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $employee);
    }

    private function isAdminOrManager(User $user): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        // Honour staff-side EmployeeRole as well as Spatie role names.
        $employee = Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->first();
        if ($employee !== null) {
            $role = EmployeeRole::tryFrom($employee->position);
            if ($role?->isManagerial() === true) {
                return true;
            }
        }
        return $user->hasAnyRole([
            Role::Owner->value,
            Role::Manager->value,
        ]);
    }

    private function shareTenant(User $user, Employee $employee): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $employee->tenant_id;
    }
}
