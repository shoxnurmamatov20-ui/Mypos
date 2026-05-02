<?php

declare(strict_types=1);

namespace App\Domain\Menu\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Menu\Models\MenuCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for menu categories. Mirrors MenuItem — reading is open
 * to every tenant user, writing is managerial.
 */
class MenuCategoryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->belongsToTenant($user) || $user->is_super_admin === true;
    }

    public function view(User $user, MenuCategory $category): bool
    {
        return $this->shareTenant($user, $category);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, MenuCategory $category): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $category);
    }

    public function delete(User $user, MenuCategory $category): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $category);
    }

    public function restore(User $user, MenuCategory $category): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $category);
    }

    public function forceDelete(User $user, MenuCategory $category): bool
    {
        return $user->is_super_admin === true;
    }

    /** Bulk update sort_order. */
    public function reorder(User $user, MenuCategory $category): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $category);
    }

    private function belongsToTenant(User $user): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null;
    }

    private function isAdminOrManager(User $user): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
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
        return $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    private function shareTenant(User $user, MenuCategory $category): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $category->tenant_id;
    }
}
