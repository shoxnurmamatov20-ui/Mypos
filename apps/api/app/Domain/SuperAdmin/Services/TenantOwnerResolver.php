<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Services;

use App\Models\User;

/**
 * Bulk owner lookup for super-admin tenant lists: one extra query for the
 * whole page instead of one per row. "Owner" = the earliest-created,
 * non-deleted user with the `owner` role (falling back to the earliest
 * user at all) — mirrors what tenant provisioning creates first.
 */
class TenantOwnerResolver
{
    /**
     * @param  list<string>  $tenantIds
     * @return array<string, User> tenant_id => owner user
     */
    public function mapByTenantIds(array $tenantIds): array
    {
        if ($tenantIds === []) {
            return [];
        }

        $users = User::query()
            ->whereIn('tenant_id', $tenantIds)
            ->where('is_super_admin', false)
            ->whereNull('deleted_at')
            ->with('roles:id,name')
            ->orderBy('created_at')
            ->get();

        $result = [];
        foreach ($users->groupBy('tenant_id') as $tenantId => $candidates) {
            $owner = $candidates->first(fn ($u): bool => $u->hasRole('owner'));
            $resolved = $owner ?? $candidates->first();
            if ($resolved !== null) {
                $result[(string) $tenantId] = $resolved;
            }
        }

        return $result;
    }
}
