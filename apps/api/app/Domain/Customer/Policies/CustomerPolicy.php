<?php

declare(strict_types=1);

namespace App\Domain\Customer\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Customer\Models\Customer;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for customer (CRM) records.
 *
 * Floor staff (cashier/waiter) may read and create new customers (so they can
 * tag a guest at the table); editing / deleting / merging is managerial to
 * protect against PII tampering or mass deletion.
 */
class CustomerPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user)
            || $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier, EmployeeRole::Waiter])
            || $user->hasAnyRole([Role::Cashier->value, Role::Waiter->value]);
    }

    public function view(User $user, Customer $customer): bool
    {
        if (! $this->shareTenant($user, $customer)) {
            return false;
        }
        return $this->isAdminOrManager($user)
            || $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier, EmployeeRole::Waiter])
            || $user->hasAnyRole([Role::Cashier->value, Role::Waiter->value]);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user)
            || $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier])
            || $user->hasAnyRole([Role::Cashier->value]);
    }

    public function update(User $user, Customer $customer): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $customer);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $customer);
    }

    public function restore(User $user, Customer $customer): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $customer);
    }

    public function forceDelete(User $user, Customer $customer): bool
    {
        return $user->is_super_admin === true;
    }

    /** Merge two customer records (dedupe). Managers and above. */
    public function merge(User $user, Customer $customer): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $customer);
    }

    private function employeeFor(User $user): ?Employee
    {
        return Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->first();
    }

    /** @param array<int, EmployeeRole> $roles */
    private function hasAnyEmployeeRole(User $user, array $roles): bool
    {
        $employee = $this->employeeFor($user);
        if ($employee === null) {
            return false;
        }
        $current = EmployeeRole::tryFrom($employee->position);
        return $current !== null && in_array($current, $roles, true);
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

    private function shareTenant(User $user, Customer $customer): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $customer->tenant_id;
    }
}
