<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Warehouse\Enums\WasteStatus;
use App\Domain\Warehouse\Models\WasteDocument;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class WasteDocumentPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function view(User $user, WasteDocument $document): bool
    {
        if (! $this->shareTenant($user, $document)) {
            return false;
        }

        return $this->isAdminOrManager($user) || $this->isChef($user);
    }

    public function create(User $user): bool
    {
        // Restricted to admin/manager only — waste docs decrement stock and
        // record financial loss; can't trust kitchen-floor staff. (security H3)
        return $this->isAdminOrManager($user);
    }

    public function update(User $user, WasteDocument $document): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $document);
    }

    public function delete(User $user, WasteDocument $document): bool
    {
        if (! $this->isAdminOrManager($user) || ! $this->shareTenant($user, $document)) {
            return false;
        }

        return $document->statusEnum() === WasteStatus::Draft;
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

    private function shareTenant(User $user, WasteDocument $document): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }

        return $user->tenant_id !== null && $user->tenant_id === $document->tenant_id;
    }
}
