<?php

declare(strict_types=1);

namespace App\Domain\Employee\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\CourierLocation;
use App\Domain\Employee\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Read-only policy for courier location records.
 *
 * Locations are emitted by the courier mobile app via API endpoints.
 * Admins inspect them from the panel; nobody mutates them through
 * Filament. All write capabilities return false.
 */
class CourierLocationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function view(User $user, CourierLocation $location): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $location);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, CourierLocation $location): bool
    {
        return false;
    }

    public function delete(User $user, CourierLocation $location): bool
    {
        return false;
    }

    public function restore(User $user, CourierLocation $location): bool
    {
        return false;
    }

    public function forceDelete(User $user, CourierLocation $location): bool
    {
        return false;
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
        return $user->hasAnyRole([
            Role::Owner->value,
            Role::Manager->value,
        ]);
    }

    private function shareTenant(User $user, CourierLocation $location): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $location->tenant_id;
    }
}
