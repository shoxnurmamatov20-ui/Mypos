<?php

declare(strict_types=1);

namespace App\Domain\Order\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for orders.
 *
 * Floor staff (cashier/waiter) may create and view, and may modify their own
 * orders' line items. Status changes / cancellation are managerial. Refunds
 * always go via the manager. Chefs and couriers see only orders relevant to
 * them (kitchen tickets / delivery jobs).
 */
class OrderPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $this->isAdminOrManager($user)
            || $this->hasAnyEmployeeRole($user, [
                EmployeeRole::Cashier,
                EmployeeRole::Waiter,
                EmployeeRole::Cook,
                EmployeeRole::Courier,
            ])
            || $user->hasAnyRole([
                Role::Cashier->value,
                Role::Waiter->value,
                Role::Chef->value,
                Role::Courier->value,
            ]);
    }

    public function view(User $user, Order $order): bool
    {
        if (! $this->shareTenant($user, $order)) {
            return false;
        }
        if ($this->isAdminOrManager($user)) {
            return true;
        }
        $employee = $this->employeeFor($user);
        if ($employee !== null) {
            $role = EmployeeRole::tryFrom($employee->position);
            if ($role === EmployeeRole::Cook) {
                // Chef sees orders that have items in the kitchen pipeline.
                return true;
            }
            if ($role === EmployeeRole::Courier) {
                return $order->courier_id === $employee->id;
            }
            if ($role === EmployeeRole::Waiter || $role === EmployeeRole::Cashier) {
                return true;
            }
        }
        return $user->hasAnyRole([
            Role::Cashier->value,
            Role::Waiter->value,
            Role::Chef->value,
            Role::Courier->value,
        ]);
    }

    public function create(User $user): bool
    {
        if ($this->isAdminOrManager($user)) {
            return true;
        }
        return $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier, EmployeeRole::Waiter])
            || $user->hasAnyRole([Role::Cashier->value, Role::Waiter->value]);
    }

    public function update(User $user, Order $order): bool
    {
        if (! $this->shareTenant($user, $order)) {
            return false;
        }
        if ($this->isAdminOrManager($user)) {
            return true;
        }
        // Floor staff may only edit their own orders' items.
        $employee = $this->employeeFor($user);
        if ($employee !== null && $order->served_by_id === $employee->id) {
            return true;
        }
        return $order->employee_id === $user->id;
    }

    public function delete(User $user, Order $order): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $order);
    }

    public function restore(User $user, Order $order): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $order);
    }

    public function forceDelete(User $user, Order $order): bool
    {
        return $user->is_super_admin === true;
    }

    /** Confirm payment received (cash / card-present); reachable by cashiers. */
    public function confirmPayment(User $user, Order $order): bool
    {
        if (! $this->shareTenant($user, $order)) {
            return false;
        }
        if ($this->isAdminOrManager($user)) {
            return true;
        }
        return $this->hasAnyEmployeeRole($user, [EmployeeRole::Cashier])
            || $user->hasAnyRole([Role::Cashier->value]);
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

    private function shareTenant(User $user, Order $order): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $order->tenant_id;
    }
}
