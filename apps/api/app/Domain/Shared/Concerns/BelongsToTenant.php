<?php

declare(strict_types=1);

namespace App\Domain\Shared\Concerns;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Attach to any tenant-scoped Eloquent model.
 *
 * Requirements for the model:
 *   - has a `tenant_id` column
 *   - optional: set $tenantScopeEnabled = false to opt out
 *
 * Security: This scope is **fail-closed by default**.
 * If no tenant context can be resolved (no Auth user, no explicit
 * `currentTenant` binding, not running in console, and not opted in via
 * `BelongsToTenant::allowEmptyTenantContext()`), queries are forced to
 * return zero rows via `whereRaw('1=0')`. This prevents accidental
 * cross-tenant data leakage from contexts like webhook handlers, queued
 * jobs, or middleware that runs before authentication completes.
 *
 * Opt-out paths:
 *   - `Model::withoutGlobalScope('tenant')` — bypass scope entirely
 *   - `BelongsToTenant::allowEmptyTenantContext()` — request-scoped flag
 *     that lets callers (super-admin tooling, console commands, public
 *     read endpoints with their own filtering) restore the previous
 *     lenient behavior, where null tenant context = no filter applied.
 */
trait BelongsToTenant
{
    /**
     * Container binding key for the per-request "lenient" toggle.
     * Trait constants cannot be accessed via self:: from static methods
     * defined inside the trait, so this is a string literal in callers.
     */
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            $tenantId = self::resolveCurrentTenantId();
            if ($tenantId !== null) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenantId);
                return;
            }

            // No tenant context resolved. Decide whether to fail-closed or
            // fall back to lenient behavior.
            if (self::shouldAllowEmptyTenantContext()) {
                return; // Lenient: no filter, caller takes responsibility.
            }

            // Fail-safe: emit a sentinel WHERE clause that yields zero rows.
            // This protects callers (e.g. future webhook handlers calling
            // `Customer::find()` outside an authenticated context) from
            // silently leaking cross-tenant rows.
            $builder->whereRaw('1=0');
        });

        static::creating(function ($model): void {
            if (empty($model->tenant_id)) {
                $tenantId = self::resolveCurrentTenantId();
                if ($tenantId !== null) {
                    $model->tenant_id = $tenantId;
                }
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Opt-in (per request) to the lenient pre-hardening behavior:
     * when tenant context is null, the scope adds NO filter at all.
     *
     * Use only in tightly scoped contexts where the caller takes full
     * responsibility for tenant isolation (super-admin tooling, console
     * commands that explicitly iterate tenants, well-audited webhook
     * handlers, etc.). Prefer `withoutGlobalScope('tenant')` for one-off
     * queries.
     */
    public static function allowEmptyTenantContext(bool $allow = true): void
    {
        app()->instance('tenant.scope.lenient', $allow);
    }

    /** Resolve tenant id from the authenticated user (or null for super admins). */
    protected static function resolveCurrentTenantId(): ?string
    {
        // Public/kiosk routes can pre-bind a tenant in the container.
        if (app()->bound('currentTenant')) {
            $current = app('currentTenant');
            if ($current instanceof Tenant) {
                return $current->id;
            }
            if (is_string($current) && $current !== '') {
                return $current;
            }
        }

        $user = Auth::user();
        if ($user === null) {
            return null;
        }
        /** @var \App\Models\User $user */
        if ($user->is_super_admin === true) {
            // Super admin sees all tenants; rely on explicit filters instead.
            return null;
        }
        return $user->tenant_id;
    }

    /**
     * Is the scope allowed to skip filtering when tenant context is null?
     * Returns true if the caller explicitly opted in via
     * `allowEmptyTenantContext()` for this request.
     *
     * Note: We deliberately do NOT auto-allow `runningInConsole()` because
     * console seeders/commands typically use `withoutGlobalScopes()` where
     * needed. Forcing fail-closed for console too means a forgotten scope
     * bypass surfaces immediately as "no rows" rather than a silent leak.
     */
    private static function shouldAllowEmptyTenantContext(): bool
    {
        if (! app()->bound('tenant.scope.lenient')) {
            return false;
        }
        return (bool) app('tenant.scope.lenient');
    }
}
