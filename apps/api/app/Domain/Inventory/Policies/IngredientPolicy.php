<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Inventory\Models\Ingredient;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for ingredients (raw stock).
 *
 * Chefs may view and adjust on-hand stock (intake, waste); CRUD on the
 * catalogue itself is managerial. Floor staff cannot access ingredients.
 */
class IngredientPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function view(User $user, Ingredient $ingredient): bool
    {
        if (! $this->shareTenant($user, $ingredient)) {
            return false;
        }
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, Ingredient $ingredient): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $ingredient);
    }

    public function delete(User $user, Ingredient $ingredient): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $ingredient);
    }

    public function restore(User $user, Ingredient $ingredient): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $ingredient);
    }

    public function forceDelete(User $user, Ingredient $ingredient): bool
    {
        return $user->is_super_admin === true;
    }

    /** Manual stock movement (delta in/out). Chef + manager. */
    public function adjustStock(User $user, Ingredient $ingredient): bool
    {
        if (! $this->shareTenant($user, $ingredient)) {
            return false;
        }
        return $this->isAdminOrManager($user) || $this->isChef($user);
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

    private function shareTenant(User $user, Ingredient $ingredient): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $ingredient->tenant_id;
    }
}
