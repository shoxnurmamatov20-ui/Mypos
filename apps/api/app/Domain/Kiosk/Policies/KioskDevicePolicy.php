<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for managing kiosk devices.
 *
 * Custom abilities (`pair`, `disable`, `forceUnpair`) cover the lifecycle
 * actions exposed by the Filament resource. They all map to "manager or
 * higher within the same tenant" — there is no per-role gradient because
 * a kiosk is a physical device the manager already controls.
 */
class KioskDevicePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function view(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
    }

    public function delete(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
    }

    public function restore(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
    }

    public function forceDelete(User $user, KioskDevice $device): bool
    {
        return $user->is_super_admin === true;
    }

    /** Issue a fresh pairing code for an unpaired (or recoverable) device. */
    public function pair(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
    }

    /** Soft-disable a paired device — its token will be rejected by the API. */
    public function disable(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
    }

    /** Destructive: revoke token + reset device back to unpaired. */
    public function forceUnpair(User $user, KioskDevice $device): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $device);
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

    private function shareTenant(User $user, KioskDevice $device): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $device->tenant_id;
    }
}
