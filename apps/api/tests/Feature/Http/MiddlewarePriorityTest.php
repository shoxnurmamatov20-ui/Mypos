<?php

declare(strict_types=1);

use App\Http\Middleware\ResolveTenantFromDomain;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Route;

/**
 * ADR-0006 regression guard: under the non-owner RLS runtime the tenant GUC
 * middleware MUST execute after Authenticate (so `$request->user()` sees the
 * bearer token via shouldUse) and before SubstituteBindings (so implicit
 * route-model binding queries run with the GUC already set). Laravel sorts
 * every stack against the kernel priority list, so we assert on the SORTED
 * order — the group array's own order proves nothing.
 */
it('runs tenant context after auth and before route model binding', function (): void {
    $route = Route::getRoutes()->getByName('v1.units.show');
    expect($route)->not->toBeNull();

    // Expands middleware groups and applies the kernel priority sort — the
    // exact stack the HTTP kernel executes.
    $sorted = app('router')->gatherRouteMiddleware($route);

    // Strip middleware parameters ("auth:sanctum" → class name comparisons).
    $names = array_map(
        static fn (string $m): string => explode(':', $m)[0],
        array_filter($sorted, 'is_string'),
    );

    $auth = array_search(Authenticate::class, $names, true);
    $domain = array_search(ResolveTenantFromDomain::class, $names, true);
    $guc = array_search(SetTenantContext::class, $names, true);
    $bindings = array_search(SubstituteBindings::class, $names, true);

    expect($auth)->not->toBeFalse()
        ->and($domain)->not->toBeFalse()
        ->and($guc)->not->toBeFalse()
        ->and($bindings)->not->toBeFalse()
        ->and($auth)->toBeLessThan($guc)
        ->and($domain)->toBeLessThan($guc)
        ->and($guc)->toBeLessThan($bindings);
});
