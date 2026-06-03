<?php

declare(strict_types=1);

namespace App\Domain\Unit\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Unit\Models\UnitOfMeasure;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for units of measure ("O'lchov birligi").
 *
 * Reference / configuration data. Any authenticated tenant user (incl. floor
 * staff) may read units so they can be referenced from inventory & menu UIs;
 * creating / editing / deleting is managerial to protect the catalogue.
 */
class UnitOfMeasurePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user)
            || $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier, EmployeeRole::Waiter])
            || $user->hasAnyRole([Role::Cashier->value, Role::Waiter->value]);
    }

    public function view(User $user, UnitOfMeasure $unit): bool
    {
        if (! $this->shareTenant($user, $unit)) {
            return false;
        }
        return $this->isAdminOrManager($user)
            || $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier, EmployeeRole::Waiter])
            || $user->hasAnyRole([Role::Cashier->value, Role::Waiter->value]);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, UnitOfMeasure $unit): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $unit);
    }

    public function delete(User $user, UnitOfMeasure $unit): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $unit);
    }

    public function restore(User $user, UnitOfMeasure $unit): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $unit);
    }

    public function forceDelete(User $user, UnitOfMeasure $unit): bool
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

    /** @param array<int, EmployeeRole> $roles */
    private function hasAnyEmployeeRole(User $user, array $roles): bool
    {
        $employee = $this->employeeFor($user);
        if ($employee === null) {
            return false;
        }
        $current = EmployeeRole::tryFrom($employee->position);
        return $current !== null && in_array($current, $roles, true);
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

    private function shareTenant(User $user, UnitOfMeasure $unit): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $unit->tenant_id;
    }
}
