<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Warehouse\Enums\AuditStatus;
use App\Domain\Warehouse\Models\AuditSession;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AuditSessionPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function view(User $user, AuditSession $session): bool
    {
        if (! $this->shareTenant($user, $session)) {
            return false;
        }

        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, AuditSession $session): bool
    {
        if (! $this->shareTenant($user, $session)) {
            return false;
        }

        // Chefs are no longer allowed to update audit session counts directly
        // (security H4) — they could otherwise zero out stock. Only the
        // designated conductor (the one who started the session) plus admins/
        // managers may record actual_quantity values.
        if ($this->isAdminOrManager($user)) {
            return true;
        }

        // Allow the conductor (if a chef started it via a manager-elevated
        // workflow in future) — currently `create()` only allows managers, so
        // this branch is rarely hit, but it future-proofs the dual-actor flow.
        return $session->conducted_by !== null
            && (int) $session->conducted_by === (int) $user->id;
    }

    public function complete(User $user, AuditSession $session): bool
    {
        if (! $this->isAdminOrManager($user) || ! $this->shareTenant($user, $session)) {
            return false;
        }

        return $session->statusEnum() === AuditStatus::InProgress;
    }

    public function delete(User $user, AuditSession $session): bool
    {
        if (! $this->isAdminOrManager($user) || ! $this->shareTenant($user, $session)) {
            return false;
        }

        return $session->statusEnum() === AuditStatus::InProgress;
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

    private function shareTenant(User $user, AuditSession $session): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }

        return $user->tenant_id !== null && $user->tenant_id === $session->tenant_id;
    }
}
