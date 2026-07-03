<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets the PostgreSQL session variable `app.current_tenant_id` so RLS
 * policies can filter rows at the database level (see migrations
 * `2026_05_01_000001_enable_rls_on_tenant_scoped_tables` and
 * `2026_07_21_000001_extend_rls_and_create_app_role`).
 *
 * History: ADR-0005 (2026-05-10) moved the project to MySQL and turned this
 * middleware into an app-side no-op; ADR-0006 (2026-07-02) moved it back to
 * PostgreSQL 18 and re-activated the GUC as tenant-isolation layer 2 behind
 * the `BelongsToTenant` Eloquent scope.
 *
 * Resolution order (first match wins):
 *   1. Authenticated user is super-admin           -> '*' (DB-level only)
 *   2. Authenticated user has tenant_id            -> that UUID
 *   3. Container has `currentTenant` (kiosk, QR)   -> that tenant's UUID
 *   4. None of the above                           -> nothing set (policies
 *      then deny by default for non-owner roles)
 *
 * The '*' wildcard is written ONLY into the database GUC, never into
 * `resolveTenantId()`'s return value — app-side consumers comparing
 * "current tenant === expected tenant" must never see '*' (Audit H-4).
 */
class SetTenantContext
{
    private const GUC = 'app.current_tenant_id';

    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $this->resolveTenantId($request);

        // ADR-0006: super admins imprint the RLS wildcard '*' at the DATABASE
        // level only — resolveTenantId() still returns null for them so no
        // app-side consumer ever mistakes '*' for a real tenant id (Audit
        // H-4). Without the wildcard, a production runtime connected as the
        // non-owner `mypos_app` role would show super admins zero rows.
        $gucValue = $tenantId ?? ($this->isSuperAdmin($request) ? '*' : null);

        if ($gucValue !== null) {
            $current = $this->lastSet();
            if ($current !== $gucValue) {
                // Postgres only — emit the GUC for RLS. On MySQL/sqlite this
                // becomes a no-op so the rest of the middleware stays portable.
                if (DB::connection()->getDriverName() === 'pgsql') {
                    DB::statement('SELECT set_config(?, ?, false)', [self::GUC, $gucValue]);
                }
                app()->instance('tenant.guc.last', $gucValue);
            }
        }

        return $next($request);
    }

    private function isSuperAdmin(Request $request): bool
    {
        $user = $request->user();

        return $user !== null && ($user->is_super_admin ?? false) === true;
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
