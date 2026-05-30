<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Warehouse\Models\Warehouse;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation for warehouses. Read access is granted to chefs + management
 * (same tier that can view ingredients). Writes are managerial only because
 * warehouse changes ripple into stock & document numbering.
 */
class WarehousePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function view(User $user, Warehouse $warehouse): bool
    {
        if (! $this->shareTenant($user, $warehouse)) {
            return false;
        }

        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, Warehouse $warehouse): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $warehouse);
    }

    public function delete(User $user, Warehouse $warehouse): bool
    {
        if (! $this->isAdminOrManager($user) || ! $this->shareTenant($user, $warehouse)) {
            return false;
        }

        // Never delete the only default warehouse — UI must transfer the flag first.
        return $warehouse->is_default === false;
    }

    private function employeeFor(User $user): ?Employee
    {
        return Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->first();
    }

    private function isChef(User $user): bool
    {
        $employee = $this->employeeFor($user);
        if ($employee !== null) {
            $role = EmployeeRole::tryFrom($employee->position);
            if ($role === EmployeeRole::Cook) {
                return true;
            }
        }

        return $user->hasRole(Role::Chef->value);
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

    private function shareTenant(User $user, Warehouse $warehouse): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }

        return $user->tenant_id !== null && $user->tenant_id === $warehouse->tenant_id;
    }
}
