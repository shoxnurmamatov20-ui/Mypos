<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Support\TenantGuc;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active tenant from the inbound `Host` header for traffic
 * arriving on a custom restaurant domain (e.g. `jomeburger.uz`).
 *
 * Runs **before** {@see SetTenantContext} so the resolved Tenant is bound
 * into the container as `currentTenant` — `SetTenantContext` then picks it
 * up. (Pre-2026-05-10 the GUC drove PostgreSQL RLS. Project is now on MySQL,
 * so the binding only feeds app-layer logging and `BelongsToTenant`.)
 *
 * Flow:
 *   1. If Host is one of our own platform hostnames (mypos.uz, *.mypos.uz,
 *      localhost, raw IP) → pass through unchanged. Auth-based tenant
 *      resolution will run downstream.
 *   2. Otherwise look up `tenant_domains.domain` (verified, not soft-deleted)
 *      and bind the parent Tenant in the container.
 *   3. Unknown / suspended → respond 404 so probing for valid hostnames
 *      cannot enumerate live tenants by status code differences.
 *
 * Cache: domain → tenant_id mapping is cached in Redis for 60s. Any change
 * to a `tenant_domains` row should bust the key (Agent C3 / observer).
 */
class ResolveTenantFromDomain
{
    private const CACHE_TTL_SECONDS = 60;

    /** Reserved hostnames that always belong to the platform itself. */
    private const OWN_DOMAINS = [
        'mypos.uz',
        'app.mypos.uz',
        'admin.mypos.uz',
        'api.mypos.uz',
        'qr.mypos.uz',
        'kitchen.mypos.uz',
        'order.mypos.uz',
        'localhost',
        '127.0.0.1',
        '::1',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());

        if ($this->isOwnDomain($host)) {
            return $next($request);
        }

        $tenantId = $this->resolveTenantId($host);

        if ($tenantId === null) {
            return $this->domainNotConfigured($host);
        }

        // Hydrate the full Tenant model — `SetTenantContext` reads ->id,
        // and the `BelongsToTenant` scope falls back to it. We deliberately
        // bypass the global tenant scope (this lookup happens *before* a
        // tenant is bound, by definition).
        $tenant = Tenant::query()
            ->whereKey($tenantId)
            ->first();

        if ($tenant === null || ! $tenant->isActive()) {
            return $this->domainNotConfigured($host);
        }

        app()->instance('currentTenant', $tenant);

        return $next($request);
    }

    /**
     * Cached domain → tenant_id lookup. We store *only* the UUID so the
     * cache value stays small and we re-hydrate the Tenant from DB (cheap
     * primary-key lookup, lets us check `isActive()` against the latest
     * row even within the cache window).
     */
    private function resolveTenantId(string $host): ?string
    {
        $key = 'tenant_domain:' . $host;

        $cached = Cache::get($key);
        if ($cached === 'MISS') {
            return null;
        }
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        // Pre-auth, pre-GUC by definition: the row that maps a hostname to
        // its tenant lives in an RLS-protected table, so read it under a
        // one-shot wildcard scope (restored immediately).
        $row = TenantGuc::scoped(TenantGuc::WILDCARD, fn () => TenantDomain::query()
            ->withoutGlobalScopes()
            ->where('domain', $host)
            ->where('is_verified', true)
            ->whereNull('deleted_at')
            ->first(['tenant_id']));

        if ($row === null) {
            // Negative cache — keep short so a freshly-verified domain
            // becomes routable within ~1 minute without a manual flush.
            Cache::put($key, 'MISS', self::CACHE_TTL_SECONDS);
            return null;
        }

        $tenantId = (string) $row->tenant_id;
        Cache::put($key, $tenantId, self::CACHE_TTL_SECONDS);
        return $tenantId;
    }

    /**
     * Match own domains against an exact-or-suffix list. Bare IPs are also
     * treated as own (k8s probes, internal load balancers, dev curl).
     */
    private function isOwnDomain(string $host): bool
    {
        foreach (self::OWN_DOMAINS as $own) {
            if ($host === $own) {
                return true;
            }
            if (str_ends_with($host, '.' . $own)) {
                return true;
            }
        }

        // IPv4 / IPv6 — a request hitting the API by IP is platform traffic
        // (health checks, internal services). Strip an IPv6 zone if present.
        $bare = $host;
        if (str_starts_with($bare, '[') && str_ends_with($bare, ']')) {
            $bare = substr($bare, 1, -1);
        }

        return filter_var($bare, FILTER_VALIDATE_IP) !== false;
    }

    private function domainNotConfigured(string $host): JsonResponse
    {
        return response()->json([
            'message' => __('Domain not configured'),
            'errors' => [
                'host' => [__('No active tenant is associated with this hostname.')],
            ],
        ], 404)->header('X-Domain-Lookup', 'miss:' . substr($host, 0, 64));
    }
}
