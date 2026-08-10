<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| PostLoginRedirector — same-origin path resolution
|--------------------------------------------------------------------------
|
| 2026-07-30 incident: `auth_redirects.*` used to store absolute URLs with
| a hardcoded host (AUTH_PORTAL_*_URL). Any user reaching the app via a
| different host (a tenant custom domain, a bare IP, a *.mypos.uz
| subdomain) got redirected to the WRONG origin after login — silently
| logged out, since the session cookie never travels cross-host.
|
| Fix: `auth_redirects.*` now stores same-origin PATHS. The frontend
| resolves them against `window.location.origin`. These tests cover the
| resolver returning a path per role, and refusing to emit anything that
| could resolve to a different host (open-redirect defense-in-depth).
*/

use App\Domain\Auth\Services\PostLoginRedirector;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;

function makeRedirectTestUser(string $role, ?Tenant $tenant = null): User
{
    $tenant ??= Tenant::factory()->create();

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);

    Role::findOrCreate($role, 'web');
    $user->assignRole($role);

    return $user;
}

it('resolves a same-origin path for a known role', function (): void {
    $user = makeRedirectTestUser('manager');

    $path = app(PostLoginRedirector::class)->resolveFor($user);

    expect($path)->toBe('/panel/manager/uz/overview');
});

it('resolves the waiter role to the in-app portal path', function (): void {
    $user = makeRedirectTestUser('waiter');

    $path = app(PostLoginRedirector::class)->resolveFor($user);

    expect($path)->toBe('/panel/portal/uz/tables');
});

it('super_admin overrides any assigned Spatie role', function (): void {
    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => true,
    ]);
    Role::findOrCreate('manager', 'web');
    $user->assignRole('manager');

    $redirector = app(PostLoginRedirector::class);

    expect($redirector->resolveRoleFor($user))->toBe('super_admin');
    expect($redirector->resolveFor($user))->toBe('/panel/admin/uz/dashboard');
});

it('falls back to default for a user with no matching role', function (): void {
    $user = User::factory()->create(['tenant_id' => Tenant::factory()->create()->id]);

    $path = app(PostLoginRedirector::class)->resolveFor($user);

    expect($path)->toBe(config('auth_redirects.default'));
});

it('rejects a protocol-relative path as an open-redirect attempt', function (): void {
    config(['auth_redirects.redirects.manager' => '//evil.example/steal-session']);
    $user = makeRedirectTestUser('manager');

    $path = app(PostLoginRedirector::class)->resolveFor($user);

    expect($path)->toBe(config('auth_redirects.default'));
});

it('rejects an absolute URL even when the host is legitimate', function (): void {
    config(['auth_redirects.redirects.manager' => 'https://mypos.uz/panel/manager/uz/overview']);
    $user = makeRedirectTestUser('manager');

    $path = app(PostLoginRedirector::class)->resolveFor($user);

    expect($path)->toBe(config('auth_redirects.default'));
});
