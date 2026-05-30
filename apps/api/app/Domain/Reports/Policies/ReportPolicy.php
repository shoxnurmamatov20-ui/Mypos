<?php

declare(strict_types=1);

namespace App\Domain\Reports\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation for the manager-panel Reports surface.
 *
 * Reports are managerial: only owners, managers, and super-admins can read
 * them. Floor staff (cashier/waiter/chef/courier) see their own data via the
 * staff-mobile stats endpoints, not the aggregated Hisobotlar pages.
 */
class ReportPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        // SECURITY: super admins on this surface MUST have a resolved tenant
        // context — otherwise BelongsToTenant returns null and the aggregation
        // unbinds across all tenants (cross-tenant data leak). The
        // ResolveTenantFromDomain middleware binds `currentTenant` on tenant
        // subdomains; if the super admin opens reports on the bare API host
        // they should be routed through /api/v1/super-admin/* instead.
        if ($user->is_super_admin === true) {
            return app()->bound('currentTenant');
        }

        if ($user->hasAnyRole([Role::Owner->value, Role::Manager->value, Role::Ceo->value])) {
            return true;
        }

        // Fall back to the Employee.position lookup — most tenants assign the
        // owner/manager role via Employee.position rather than spatie roles,
        // and Filament hasn't always populated both sides.
        $employee = Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->first();

        if ($employee === null) {
            return false;
        }

        $role = EmployeeRole::tryFrom($employee->position);
        return $role !== null && $role->isManagerial();
    }
}
