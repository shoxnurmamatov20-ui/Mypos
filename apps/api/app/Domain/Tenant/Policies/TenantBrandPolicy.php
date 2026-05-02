<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Tenant\Models\TenantBrand;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for `TenantBrand`.
 *
 * Read: any tenant member with owner/manager role.
 * Write: same — Brand is non-destructive enough that managers can iterate.
 *
 * Super admins are intentionally NOT granted view/update here: branding is a
 * tenant-owned surface. Super admins can update via the platform-level
 * super-admin tenant editor instead.
 */
class TenantBrandPolicy
{
    use HandlesAuthorization;

    public function view(User $user, TenantBrand $brand): bool
    {
        return $this->shareTenant($user, $brand)
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function update(User $user, TenantBrand $brand): bool
    {
        return $this->shareTenant($user, $brand)
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    private function shareTenant(User $user, TenantBrand $brand): bool
    {
        return $user->tenant_id !== null
            && $user->tenant_id === $brand->tenant_id;
    }
}
