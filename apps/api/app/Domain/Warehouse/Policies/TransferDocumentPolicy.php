<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Warehouse\Enums\TransferStatus;
use App\Domain\Warehouse\Models\TransferDocument;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TransferDocumentPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function view(User $user, TransferDocument $document): bool
    {
        if (! $this->shareTenant($user, $document)) {
            return false;
        }

        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, TransferDocument $document): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $document);
    }

    public function delete(User $user, TransferDocument $document): bool
    {
        if (! $this->isAdminOrManager($user) || ! $this->shareTenant($user, $document)) {
            return false;
        }

        // Delete is allowed only for draft transfers — receipted ones are
        // already in the stock-movement audit trail.
        return $document->statusEnum() === TransferStatus::Draft;
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

    private function shareTenant(User $user, TransferDocument $document): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }

        return $user->tenant_id !== null && $user->tenant_id === $document->tenant_id;
    }
}
