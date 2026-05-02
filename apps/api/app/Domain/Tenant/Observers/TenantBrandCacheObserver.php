<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Observers;

use App\Domain\Tenant\Models\TenantBrand;
use App\Domain\Tenant\Models\TenantDomain;
use Illuminate\Support\Facades\Cache;

/**
 * Bust the resolve-domain + restaurant-detail caches whenever a tenant's
 * brand changes. Without this, custom-domain visitors see stale logos /
 * colors for up to 60s after the owner saves brand changes in Filament.
 *
 * Cache keys (set by PublicResolveDomainController + PublicRestaurantController):
 *   - public:resolve-domain:{host}        — host → {slug, name, brand} bundle
 *   - public:restaurant:{slug}            — restaurant detail page
 *
 * Domain-level cache invalidation is handled in
 * {@see \App\Http\Middleware\ResolveTenantFromDomain} (negative cache) and
 * {@see VerifyDomainJob} (positive cache).
 */
class TenantBrandCacheObserver
{
    public function saved(TenantBrand $brand): void
    {
        $this->bust($brand->tenant_id);
    }

    public function deleted(TenantBrand $brand): void
    {
        $this->bust($brand->tenant_id);
    }

    public function restored(TenantBrand $brand): void
    {
        $this->bust($brand->tenant_id);
    }

    private function bust(?string $tenantId): void
    {
        if ($tenantId === null || $tenantId === '') {
            return;
        }

        // Forget every host that maps to this tenant.
        $hosts = TenantDomain::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->pluck('domain');

        foreach ($hosts as $host) {
            Cache::forget('public:resolve-domain:' . strtolower((string) $host));
            Cache::forget('tenant_domain:' . strtolower((string) $host));
        }

        // Restaurant detail listing also embeds brand (logo etc.), bump version.
        Cache::increment('public:restaurants:version');
    }
}
