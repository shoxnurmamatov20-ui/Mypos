<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Inventory\Models\Recipe;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for menu-item recipes (BOMs).
 *
 * Chefs read recipes (they need to see ingredient lists); writes are
 * managerial — recipe edits propagate to costing & deduction.
 */
class RecipePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function view(User $user, Recipe $recipe): bool
    {
        if (! $this->shareTenant($user, $recipe)) {
            return false;
        }
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, Recipe $recipe): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $recipe);
    }

    public function delete(User $user, Recipe $recipe): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $recipe);
    }

    public function restore(User $user, Recipe $recipe): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $recipe);
    }

    public function forceDelete(User $user, Recipe $recipe): bool
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

    private function shareTenant(User $user, Recipe $recipe): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $recipe->tenant_id;
    }
}
