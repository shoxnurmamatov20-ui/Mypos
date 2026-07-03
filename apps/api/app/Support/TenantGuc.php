<?php

declare(strict_types=1);

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\DB;

/**
 * Single write-path for the PostgreSQL `app.current_tenant_id` GUC that the
 * Row-Level-Security policies key on (ADR-0006, layer 2 behind the
 * `BelongsToTenant` Eloquent scope).
 *
 * Who writes the GUC:
 *   - {@see \App\Http\Middleware\SetTenantContext} — every authenticated
 *     API/Filament request (tenant UUID, or '*' for super admins / the CEO
 *     cross-tenant surface).
 *   - Pre-auth flows that legitimately resolve a tenant *after* the global
 *     middleware ran: kiosk device auth, public slug endpoints, staff PIN
 *     login, guest order tracking, payment/EAS webhooks.
 *
 * `imprint()` is request-scoped: `SetTenantContext::terminate()` resets the
 * GUC when the response is sent, so pooled FPM workers never leak a tenant
 * imprint into the next request. `scoped()` restores the previous value
 * immediately and is preferred for one-shot cross-tenant lookups.
 *
 * On non-PostgreSQL drivers every method is a no-op so the test-suite and
 * any future driver swap stay portable.
 */
final class TenantGuc
{
    public const WILDCARD = '*';

    private const GUC = 'app.current_tenant_id';

    /** Container key remembering the last imprinted value (reset in terminate). */
    public const LAST_BINDING = 'tenant.guc.last';

    /**
     * Set the GUC for the remainder of the request. `null` is a no-op —
     * policies then deny by default for the non-owner runtime role.
     */
    public static function imprint(?string $value): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $current = app()->bound(self::LAST_BINDING) ? (string) app(self::LAST_BINDING) : null;
        if ($current === $value) {
            return;
        }

        DB::statement('SELECT set_config(?, ?, false)', [self::GUC, $value]);
        app()->instance(self::LAST_BINDING, $value);
    }

    /**
     * Run `$callback` with the GUC temporarily set to `$value`, restoring the
     * previous value afterwards. Use for one-shot lookups that must see
     * across tenants (guest token resolution, webhook row location) without
     * widening the rest of the request.
     *
     * @template TReturn
     *
     * @param  Closure(): TReturn  $callback
     * @return TReturn
     */
    public static function scoped(string $value, Closure $callback): mixed
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return $callback();
        }

        $previous = (string) (DB::selectOne(
            'SELECT current_setting(?, true) AS value',
            [self::GUC],
        )->value ?? '');

        DB::statement('SELECT set_config(?, ?, false)', [self::GUC, $value]);

        try {
            return $callback();
        } finally {
            DB::statement('SELECT set_config(?, ?, false)', [self::GUC, $previous]);
        }
    }

    /**
     * Clear the GUC on the pooled connection (end-of-request hygiene).
     * Called from `SetTenantContext::terminate()`.
     */
    public static function reset(): void
    {
        if (! app()->bound(self::LAST_BINDING)) {
            return;
        }

        try {
            if (DB::connection()->getDriverName() === 'pgsql') {
                DB::statement('SELECT set_config(?, ?, false)', [self::GUC, '']);
            }
            app()->forgetInstance(self::LAST_BINDING);
        } catch (\Throwable) {
            // Connection may already be closed/returned to the pool — ignore.
        }
    }
}
