<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Tenant\Models\TenantApp;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for `TenantApp`.
 *
 * Read: owner + manager — managers need visibility for support /
 *        screenshots collection.
 * Write: owner only — pushing a build to App Store / Play Store is
 *        irreversible reputational + financial action; a single-location
 *        manager should not be able to dispatch one.
 *
 * Cross-tenant access is impossible through this policy: every check
 * verifies `tenant_id` equality. Soft-deleted rows are filtered by the
 * Eloquent SoftDeletes trait at the query layer.
 */
class TenantAppPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function view(User $user, TenantApp $app): bool
    {
        return $this->shareTenant($user, $app)
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null
            && $user->hasRole(Role::Owner->value);
    }

    public function update(User $user, TenantApp $app): bool
    {
        return $this->shareTenant($user, $app)
            && $user->hasRole(Role::Owner->value);
    }

    public function delete(User $user, TenantApp $app): bool
    {
        return $this->shareTenant($user, $app)
            && $user->hasRole(Role::Owner->value);
    }

    /** Trigger an EAS Build — write-equivalent. */
    public function build(User $user, TenantApp $app): bool
    {
        return $this->update($user, $app);
    }

    /** Cancel an in-progress build — write-equivalent. */
    public function cancel(User $user, TenantApp $app): bool
    {
        return $this->update($user, $app);
    }

    private function shareTenant(User $user, TenantApp $app): bool
    {
        return $user->tenant_id !== null
            && $user->tenant_id === $app->tenant_id;
    }
}
