<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Auth\Enums\Role;
use App\Support\TenantGuc;
use Closure;
use Illuminate\Http\Request;
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
 *   2. CEO-role user on the /api/v1/ceo/* surface  -> '*' (DB-level only;
 *      controllers scope every query to ownedTenantIds() — same posture as
 *      super admin, required because a CEO legitimately reads N tenants)
 *   3. Authenticated user has tenant_id            -> that UUID
 *   4. Container has `currentTenant` (kiosk, QR)   -> that tenant's UUID
 *   5. None of the above                           -> nothing set (policies
 *      then deny by default for non-owner roles)
 *
 * The '*' wildcard is written ONLY into the database GUC, never into
 * `resolveTenantId()`'s return value — app-side consumers comparing
 * "current tenant === expected tenant" must never see '*' (Audit H-4).
 *
 * Pre-auth flows that resolve a tenant later in the request (public slug
 * endpoints, kiosk device auth, staff PIN login, webhooks) imprint through
 * {@see TenantGuc} themselves.
 */
class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        // Wildcard surfaces first: a CEO may also carry a tenant_id, but on
        // /api/v1/ceo/* they must read their whole owned set, not one tenant.
        $gucValue = $this->isSuperAdmin($request) || $this->isCeoSurface($request)
            ? TenantGuc::WILDCARD
            : $this->resolveTenantId($request);

        TenantGuc::imprint($gucValue);

        return $next($request);
    }

    /**
     * Reset the GUC after the response is sent so the next request on this
     * pooled connection starts clean. Skip if no SET happened.
     */
    public function terminate(Request $request, Response $response): void
    {
        TenantGuc::reset();
    }

    private function isSuperAdmin(Request $request): bool
    {
        $user = $request->user();

        return $user !== null && ($user->is_super_admin ?? false) === true;
    }

    /**
     * CEO consolidated surface: cross-tenant by design. The DB-level '*'
     * mirrors what the table-owner connection allowed implicitly before the
     * runtime moved to the non-owner `mypos_app` role; row scoping remains
     * the controllers' explicit `ownedTenantIds()` filters (layer 1).
     */
    private function isCeoSurface(Request $request): bool
    {
        if (! $request->is('api/v1/ceo/*')) {
            return false;
        }

        $user = $request->user();

        return $user !== null && $user->hasRole(Role::Ceo->value);
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
