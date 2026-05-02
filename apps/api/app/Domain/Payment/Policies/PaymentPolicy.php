<?php

declare(strict_types=1);

namespace App\Domain\Payment\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Payment\Models\Payment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for payments.
 *
 * Cashiers may create payment intents (cash, card-present). Manual capture
 * (cash) and refunds belong to managers. Refunds above LARGE_REFUND_THRESHOLD
 * (1,000,000 minor units = 10,000 UZS major) require an owner-or-above to
 * prevent waiter/cashier escalation paths.
 */
class PaymentPolicy
{
    use HandlesAuthorization;

    /** Refund amount in minor units that requires owner-or-above approval. */
    private const LARGE_REFUND_THRESHOLD = 1_000_000;

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isCashier($user);
    }

    public function view(User $user, Payment $payment): bool
    {
        if (! $this->shareTenant($user, $payment)) {
            return false;
        }
        return $this->isAdminOrManager($user) || $this->isCashier($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrManager($user) || $this->isCashier($user);
    }

    public function update(User $user, Payment $payment): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $payment);
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->is_super_admin === true;
    }

    public function restore(User $user, Payment $payment): bool
    {
        return $user->is_super_admin === true;
    }

    public function forceDelete(User $user, Payment $payment): bool
    {
        return $user->is_super_admin === true;
    }

    /** Manual capture (cash flow) — managers only. */
    public function capture(User $user, Payment $payment): bool
    {
        return $this->isAdminOrManager($user) && $this->shareTenant($user, $payment);
    }

    /**
     * Refund a payment. Large refunds (> threshold) must be owner-or-above
     * to make sure a single manager cannot drain a tenant's account.
     */
    public function refund(User $user, Payment $payment, ?int $amount = null): bool
    {
        if (! $this->shareTenant($user, $payment)) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return true;
        }
        $effectiveAmount = $amount ?? (int) $payment->amount;
        if ($effectiveAmount > self::LARGE_REFUND_THRESHOLD) {
            return $user->hasRole(Role::Owner->value);
        }
        return $this->isAdminOrManager($user);
    }

    private function employeeFor(User $user): ?Employee
    {
        return Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->first();
    }

    private function isCashier(User $user): bool
    {
        $employee = $this->employeeFor($user);
        if ($employee !== null) {
            $role = EmployeeRole::tryFrom($employee->position);
            if ($role === EmployeeRole::Cashier) {
                return true;
            }
        }
        return $user->hasRole(Role::Cashier->value);
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

    private function shareTenant(User $user, Payment $payment): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $payment->tenant_id;
    }
}
