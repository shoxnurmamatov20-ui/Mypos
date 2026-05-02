<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Read-only audit policy for kiosk pairing codes.
 *
 * Codes are created by GeneratePairingCodeAction (invoked from the kiosk
 * device row action) and consumed by PairKioskDeviceAction. They are never
 * mutated through the panel — the resource is purely an audit log.
 */
class KioskPairingCodePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function view(User $user, KioskPairingCode $code): bool
    {
        return $this->isAdminOrManager($user)
            && $this->shareTenant($user, $code);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, KioskPairingCode $code): bool
    {
        return false;
    }

    public function delete(User $user, KioskPairingCode $code): bool
    {
        return false;
    }

    public function restore(User $user, KioskPairingCode $code): bool
    {
        return false;
    }

    public function forceDelete(User $user, KioskPairingCode $code): bool
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

    private function shareTenant(User $user, KioskPairingCode $code): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $code->tenant_id;
    }
}
