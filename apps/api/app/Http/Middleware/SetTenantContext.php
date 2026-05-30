<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Originally set the PostgreSQL session variable `app.current_tenant_id` so
 * RLS policies could filter rows at the database level (see migration
 * `2026_05_01_000001_enable_rls_on_tenant_scoped_tables`).
 *
 * **2026-05-10 (ADR-0005)** — project switched to MySQL 8.4. RLS no longer
 * exists, so the GUC `set_config()` call is a no-op on MySQL. The middleware
 * is retained because:
 *   1. It still resolves the active tenant and exposes it via `app('currentTenant')`
 *      / `tenant.guc.last` for downstream consumers (logging, audit, debug).
 *   2. If the project ever reverts to Postgres (rollback path in ADR-0005),
 *      flipping a single conditional re-enables RLS without rewiring
 *      every controller.
 *
 * Resolution order (first match wins):
 *   1. Authenticated user is super-admin           -> '*' (cross-tenant access)
 *   2. Authenticated user has tenant_id            -> that UUID
 *   3. Container has `currentTenant` (kiosk, QR)   -> that tenant's UUID
 *   4. None of the above                           -> nothing recorded
 *
 * Tenant isolation now relies SOLELY on the application-layer
 * `BelongsToTenant` global scope. Reviewers must catch any
 * `withoutGlobalScopes()` call outside `SuperAdminScope::unguard()`.
 */
class SetTenantContext
{
    private const GUC = 'app.current_tenant_id';

    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $this->resolveTenantId($request);

        if ($tenantId !== null) {
            $current = $this->lastSet();
            if ($current !== $tenantId) {
                // Postgres only — emit the GUC for RLS. On MySQL/sqlite this
                // becomes a no-op so the rest of the middleware stays portable.
                if (DB::connection()->getDriverName() === 'pgsql') {
                    DB::statement('SELECT set_config(?, ?, false)', [self::GUC, $tenantId]);
                }
                app()->instance('tenant.guc.last', $tenantId);
            }
        }

        return $next($request);
    }

    /**
     * Reset the GUC after the response is sent so the next request on this
     * pooled connection starts clean. Skip if no SET happened.
     */
    public function terminate(Request $request, Response $response): void
    {
        if (! app()->bound('tenant.guc.last')) {
            return;
        }
        try {
            if (DB::connection()->getDriverName() === 'pgsql') {
                DB::statement('SELECT set_config(?, ?, false)', [self::GUC, '']);
            }
            app()->forgetInstance('tenant.guc.last');
        } catch (\Throwable $e) {
            // Connection may already be closed/returned to the pool — ignore.
        }
    }

    private function lastSet(): ?string
    {
        return app()->bound('tenant.guc.last') ? (string) app('tenant.guc.last') : null;
    }

    private function resolveTenantId(Request $request): ?string
    {
        $user = $request->user();

        // Audit H-4 (ADR-0005 follow-up): super admins do NOT get a tenant
        // imprint. The legacy '*' wildcard fed the Postgres GUC for an RLS
        // bypass; on MySQL it has no effect, but storing it in
        // app('tenant.guc.last') was a poison sentinel for any future
        // consumer that compares "current tenant === expected tenant".
        if ($user !== null && ($user->is_super_admin ?? false) === true) {
            return null;
        }

        if ($user !== null && ! empty($user->tenant_id)) {
            return (string) $user->tenant_id;
        }

        if (app()->bound('currentTenant')) {
            $tenant = app('currentTenant');
            if ($tenant !== null && ! empty($tenant->id)) {
                return (string) $tenant->id;
            }
        }

        return null;
    }
}
