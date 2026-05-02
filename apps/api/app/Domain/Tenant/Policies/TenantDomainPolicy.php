<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Tenant\Models\TenantDomain;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for `TenantDomain`.
 *
 * Read: owner + manager (managers need visibility into SSL state for support).
 * Write: owner only — adding / removing a domain has reputational + DNS-zone
 *        consequences that should not be delegable to a single-location manager.
 */
class TenantDomainPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function view(User $user, TenantDomain $domain): bool
    {
        return $this->shareTenant($user, $domain)
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null
            && $user->hasRole(Role::Owner->value);
    }

    public function update(User $user, TenantDomain $domain): bool
    {
        return $this->shareTenant($user, $domain)
            && $user->hasRole(Role::Owner->value);
    }

    public function delete(User $user, TenantDomain $domain): bool
    {
        return $this->shareTenant($user, $domain)
            && $user->hasRole(Role::Owner->value);
    }

    /** Trigger DNS verification — owner-only, write-equivalent. */
    public function verify(User $user, TenantDomain $domain): bool
    {
        return $this->update($user, $domain);
    }

    /** Mark this domain as primary — owner-only. */
    public function setPrimary(User $user, TenantDomain $domain): bool
    {
        return $this->update($user, $domain);
    }

    private function shareTenant(User $user, TenantDomain $domain): bool
    {
        return $user->tenant_id !== null
            && $user->tenant_id === $domain->tenant_id;
    }
}
