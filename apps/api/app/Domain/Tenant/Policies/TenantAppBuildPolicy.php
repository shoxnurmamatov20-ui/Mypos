<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Policies;

use App\Domain\Auth\Enums\Role;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorisation rules for `TenantAppBuild`.
 *
 * Read: owner + manager (so managers can monitor build history).
 * Write (cancel): owner only — same rationale as TenantAppPolicy.
 *
 * Note: there is no `create` here because builds are created exclusively by
 * {@see \App\Domain\Tenant\Actions\GenerateNativeAppAction}, which goes
 * through {@see TenantAppPolicy::build()} instead.
 */
class TenantAppBuildPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function view(User $user, TenantAppBuild $build): bool
    {
        return $this->shareTenant($user, $build)
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }

    public function cancel(User $user, TenantAppBuild $build): bool
    {
        return $this->shareTenant($user, $build)
            && $user->hasRole(Role::Owner->value);
    }

    private function shareTenant(User $user, TenantAppBuild $build): bool
    {
        return $user->tenant_id !== null
            && $user->tenant_id === $build->tenant_id;
    }
}
