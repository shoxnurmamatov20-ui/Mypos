<?php

declare(strict_types=1);

namespace App\Domain\Menu\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Menu\Models\MenuItem;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for menu items.
 *
 * Reading the menu is open to every authenticated tenant user (every floor
 * role needs to see what they can sell). Writes are managerial.
 */
class MenuItemPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->belongsToTenant($user) || $user->is_super_admin === true;
    }

    public function view(User $user, MenuItem $item): bool
    {
        return $this->shareTenant($user, $item);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, MenuItem $item): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $item);
    }

    public function delete(User $user, MenuItem $item): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $item);
    }

    public function restore(User $user, MenuItem $item): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $item);
    }

    public function forceDelete(User $user, MenuItem $item): bool
    {
        return $user->is_super_admin === true;
    }

    /** Toggle is_active=true. */
    public function publish(User $user, MenuItem $item): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $item);
    }

    /** Toggle is_active=false (e.g., out of stock). */
    public function unpublish(User $user, MenuItem $item): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $item);
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

    private function shareTenant(User $user, MenuItem $item): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $item->tenant_id;
    }
}
