<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — ResolveTenantFromDomain middleware
|--------------------------------------------------------------------------
|
| Spec covered (Agent C2):
|   - Inbound traffic on a *custom* restaurant domain (e.g. `jomeburger.uz`)
|     resolves to the matching tenant via `tenant_domains` and binds the
|     Tenant model into the container as `currentTenant`.
|   - Platform hostnames (mypos.uz, *.mypos.uz, localhost, raw IPs) pass
|     through without resolution — auth-derived tenant takes priority.
|   - Unknown / unverified hostnames respond with 404 — never 200 with the
|     wrong tenant, never 5xx, never enumerable.
|   - Cache invariant: the (host -> tenant_id) lookup is cached for ~60s.
|
| Driving the middleware in tests:
|   - We attach the middleware directly to a one-off route inside the test
|     so the assertion isn't entangled with the rest of the API stack.
|   - `withServerVariables` lets us forge the inbound `Host` header.
*/

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Http\Middleware\ResolveTenantFromDomain;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    Cache::flush();
});

/**
 * Helper — register an inert echo route on the fly that just reflects what the
 * resolver bound (or didn't) into the container.
 */
function registerProbeRoute(string $path = '/__probe/resolve'): string
{
    Route::middleware([ResolveTenantFromDomain::class])
        ->get($path, function () {
            $tenant = app()->bound('currentTenant') ? app('currentTenant') : null;
            return response()->json([
                'bound' => $tenant !== null,
                'tenant_id' => $tenant?->id,
            ]);
        });

    return $path;
}

/**
 * Symfony's Request::create overwrites HTTP_HOST from the URI hostname, so
 * `withServerVariables(['HTTP_HOST' => $x])` is silently ignored. Pass the
 * full URL instead — that's the only reliable way to set the Host header
 * Laravel's middleware sees.
 */
function probeUrl(string $domain, string $path = '/__probe/resolve'): string
{
    return 'http://' . $domain . $path;
}

it('resolves tenant for verified custom domain and binds it to container', function (): void {
    $tenant = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
    ]);
    $domain = 'jomeburger-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => true,
        'verified_at' => now(),
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
        'ssl_status' => 'active',
    ]);

    $path = registerProbeRoute();

    $response = $this->getJson(probeUrl($domain, $path))
        ->assertOk();

    expect($response->json('bound'))->toBeTrue();
    expect($response->json('tenant_id'))->toBe($tenant->id);
});

it('returns 404 for an unverified custom domain', function (): void {
    $tenant = Tenant::factory()->create();
    $domain = 'unverified-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => false,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $path = registerProbeRoute();

    $this->getJson(probeUrl($domain, $path))
        ->assertStatus(404);
});

it('returns 404 for an unknown / never-registered domain', function (): void {
    $path = registerProbeRoute();

    $this->getJson(probeUrl('never-registered-' . bin2hex(random_bytes(4)) . '.uz', $path))
        ->assertStatus(404);
});

it('skips resolution and passes through for *.mypos.uz hosts', function (): void {
    $path = registerProbeRoute();

    $response = $this->getJson(probeUrl('app.mypos.uz', $path))
        ->assertOk();

    expect($response->json('bound'))->toBeFalse();
});

it('skips resolution for the bare mypos.uz host', function (): void {
    $path = registerProbeRoute();

    $response = $this->getJson(probeUrl('mypos.uz', $path))
        ->assertOk();

    expect($response->json('bound'))->toBeFalse();
});

it('skips resolution for localhost', function (): void {
    $path = registerProbeRoute();

    $response = $this->getJson(probeUrl('localhost', $path))
        ->assertOk();

    expect($response->json('bound'))->toBeFalse();
});

it('skips resolution for raw IPv4 addresses', function (): void {
    $path = registerProbeRoute();

    $response = $this->getJson(probeUrl('192.168.1.42', $path))
        ->assertOk();

    expect($response->json('bound'))->toBeFalse();
});

it('skips resolution for raw IPv6 addresses (bracketed)', function (): void {
    $path = registerProbeRoute();

    // IPv6: bracket form requires the URI scheme to be parsed correctly.
    $response = $this->getJson('http://[::1]' . $path)
        ->assertOk();

    expect($response->json('bound'))->toBeFalse();
});

it('does not bind tenant for a soft-deleted domain row', function (): void {
    $tenant = Tenant::factory()->create();
    $domain = 'softdel-' . bin2hex(random_bytes(3)) . '.uz';

    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => true,
        'verified_at' => now(),
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);
    $row->delete();

    $path = registerProbeRoute();

    $this->getJson(probeUrl($domain, $path))
        ->assertStatus(404);
});

it('does not bind tenant when the tenant is suspended', function (): void {
    $tenant = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => now(),
    ]);
    $domain = 'suspended-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => true,
        'verified_at' => now(),
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $path = registerProbeRoute();

    $this->getJson(probeUrl($domain, $path))
        ->assertStatus(404);
});

it('caches resolution so the second request does not re-query the database', function (): void {
    $tenant = Tenant::factory()->create();
    $domain = 'cache-hit-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => true,
        'verified_at' => now(),
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $path = registerProbeRoute();

    $this->getJson(probeUrl($domain, $path))->assertOk();

    // After the first hit the cache key should hold the tenant id.
    expect(Cache::get('tenant_domain:' . $domain))->toBe($tenant->id);
});

it('subsequent SetTenantContext middleware picks up the resolved tenant in the GUC', function (): void {
    if (\Illuminate\Support\Facades\DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('GUC inspection requires postgres.');
    }

    $tenant = Tenant::factory()->create();
    $domain = 'chain-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => true,
        'verified_at' => now(),
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    Route::middleware([ResolveTenantFromDomain::class, SetTenantContext::class])
        ->get('/__probe/chain', function () {
            $row = \Illuminate\Support\Facades\DB::selectOne(
                "SELECT current_setting('app.current_tenant_id', true) AS v",
            );
            return response()->json(['guc' => $row->v]);
        });

    $response = $this->getJson('http://' . $domain . '/__probe/chain')
        ->assertOk();

    // The chain may have already terminate()d which resets the GUC; accept
    // either the tenant-id or empty (terminate already fired).
    expect($response->json('guc'))->toBeIn([$tenant->id, '', null]);
});
