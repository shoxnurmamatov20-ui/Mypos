<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for tenant records.
 *
 * Tenants are platform-level resources — most actions are super-admin-only.
 * The one exception is `update`: an Owner may update *their own* tenant
 * (limited safe fields like name, locale, branding). Status changes
 * (suspend/unsuspend) and creation/deletion remain platform-only.
 */
class TenantPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->is_super_admin === true;
    }

    public function view(User $user, Tenant $tenant): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        // An owner may inspect their own tenant.
        return $this->shareTenant($user, $tenant) && $user->hasRole(Role::Owner->value);
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin === true;
    }

    public function update(User $user, Tenant $tenant): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        // Owner self-service edits — controller MUST limit which fields can change.
        return $this->shareTenant($user, $tenant) && $user->hasRole(Role::Owner->value);
    }

    public function delete(User $user, Tenant $tenant): bool
    {
        return $user->is_super_admin === true;
    }

    public function restore(User $user, Tenant $tenant): bool
    {
        return $user->is_super_admin === true;
    }

    public function forceDelete(User $user, Tenant $tenant): bool
    {
        return $user->is_super_admin === true;
    }

    /** Suspend a tenant — platform-level lockout. */
    public function suspend(User $user, Tenant $tenant): bool
    {
        return $user->is_super_admin === true;
    }

    /** Unsuspend a tenant. */
    public function unsuspend(User $user, Tenant $tenant): bool
    {
        return $user->is_super_admin === true;
    }

    private function shareTenant(User $user, Tenant $tenant): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null && $user->tenant_id === $tenant->id;
    }
}
