<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets the PostgreSQL session variable `app.current_tenant_id` so the RLS
 * policies on tenant-scoped tables (see migration
 * `2026_05_01_000001_enable_rls_on_tenant_scoped_tables`) filter rows to the
 * current tenant.
 *
 * Resolution order (first match wins):
 *   1. Authenticated user is super-admin           -> '*' (cross-tenant access)
 *   2. Authenticated user has tenant_id            -> that UUID
 *   3. Container has `currentTenant` (kiosk, QR)   -> that tenant's UUID
 *   4. None of the above                           -> GUC unset (RLS denies all)
 *
 * Notes:
 *   - We use `set_config(..., false)` rather than `SET LOCAL` because Laravel
 *     HTTP requests are not always inside a transaction. Without a transaction,
 *     `SET LOCAL` would be a silent no-op.
 *   - The GUC is reset on `terminate()` so a pooled connection (PgBouncer in
 *     transaction mode is fine; in session mode this is critical) can never
 *     leak tenant context into the next request.
 */
class SetTenantContext
{
    private const GUC = 'app.current_tenant_id';

    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $this->resolveTenantId($request);

        if ($tenantId !== null) {
            // Skip the SET if the connection already has the right value
            // (PgBouncer session-mode reuse). Halves Postgres roundtrips
            // on the steady-state per-request path.
            $current = $this->lastSet();
            if ($current !== $tenantId) {
                // set_config(name, value, is_local) — third arg `false` = session-scoped.
                // Bound via parameter to prevent SQL injection through tenant_id.
                DB::statement('SELECT set_config(?, ?, false)', [self::GUC, $tenantId]);
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
            return; // Never set in this request — nothing to reset.
        }
        try {
            DB::statement('SELECT set_config(?, ?, false)', [self::GUC, '']);
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

        if ($user !== null && ($user->is_super_admin ?? false) === true) {
            return '*';
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
