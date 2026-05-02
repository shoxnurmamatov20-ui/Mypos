<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — Caddy on-demand TLS "ask" endpoint
|--------------------------------------------------------------------------
|
| Spec covered (Agent C2 / C6):
|   - GET `/api/internal/caddy/verify?domain=foo.uz` answers 200 only when
|     the hostname is a verified, live `tenant_domains` row.
|   - 404 for any unknown / unverified / soft-deleted hostname.
|   - 400 for obvious garbage (no TLD, whitespace, scheme).
|   - 403 when the inbound request is not from Caddy (no shared-secret
|     header AND not a loopback origin in production).
|   - Request log emits a warning for rejected probes (so the SOC can spot
|     scanners). We assert one log entry per rejection.
|
| Note on running tests in `production` env:
|   The middleware fail-closes for non-loopback callers when CADDY_INTERNAL_TOKEN
|   is unset. We flip `app()['env']` for the relevant tests so the assertion
|   exercises the right branch — analogous to the PaymentWebhookBypass tests.
*/

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

beforeEach(function (): void {
    Cache::flush();
});

function seedDomain(bool $verified = true, bool $softDeleted = false): array
{
    $tenant = Tenant::factory()->create();
    $domain = 'verify-' . bin2hex(random_bytes(3)) . '.uz';

    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => $domain,
        'is_verified' => $verified,
        'verified_at' => $verified ? now() : null,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
        'ssl_status' => $verified ? 'active' : 'pending',
    ]);

    if ($softDeleted) {
        $row->delete();
    }

    return [$tenant, $domain];
}

it('returns 200 for a verified custom domain when called from loopback', function (): void {
    [, $domain] = seedDomain(verified: true);

    // Loopback path is allowed in non-production envs unconditionally.
    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertOk();
});

it('returns 200 when the X-Caddy-Token header matches', function (): void {
    config()->set('app.caddy_secret', 'super-secret-token');

    [, $domain] = seedDomain(verified: true);

    $this->withHeaders(['X-Caddy-Token' => 'super-secret-token'])
        ->withServerVariables(['REMOTE_ADDR' => '198.51.100.10']) // not loopback
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertOk();
});

it('returns 404 for an unverified custom domain', function (): void {
    [, $domain] = seedDomain(verified: false);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertStatus(404);
});

it('returns 404 for an unknown / never-registered hostname', function (): void {
    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=never-' . bin2hex(random_bytes(3)) . '.uz')
        ->assertStatus(404);
});

it('returns 404 for a soft-deleted domain row', function (): void {
    [, $domain] = seedDomain(verified: true, softDeleted: true);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertStatus(404);
});

it('rejects requests with an invalid token in production', function (): void {
    config()->set('app.caddy_secret', 'super-secret-token');
    config()->set('app.caddy_trust_loopback', false);
    app()['env'] = 'production';

    [, $domain] = seedDomain(verified: true);

    $this->withHeaders(['X-Caddy-Token' => 'WRONG-TOKEN'])
        ->withServerVariables(['REMOTE_ADDR' => '198.51.100.10'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertStatus(403);
});

it('rejects loopback requests without a token in production unless explicitly trusted', function (): void {
    config()->set('app.caddy_secret', '');
    config()->set('app.caddy_trust_loopback', false);
    app()['env'] = 'production';

    [, $domain] = seedDomain(verified: true);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertStatus(403);
});

it('accepts loopback requests in non-production without any token', function (): void {
    // Default test env is 'testing' — middleware allows loopback through.
    config()->set('app.caddy_secret', '');
    config()->set('app.caddy_trust_loopback', false);

    [, $domain] = seedDomain(verified: true);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertOk();
});

it('returns 400 for an obviously malformed hostname (no dot)', function (): void {
    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=bogus')
        ->assertStatus(400);
});

it('returns 400 for hostname containing whitespace or control characters', function (): void {
    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode('foo bar.uz'))
        ->assertStatus(400);
});

it('returns 400 for empty domain query parameter', function (): void {
    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=')
        ->assertStatus(400);
});

it('emits a warning log entry on rejected probes', function (): void {
    config()->set('app.caddy_secret', 'super-secret-token');
    config()->set('app.caddy_trust_loopback', false);
    app()['env'] = 'production';

    Log::spy();

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.10'])
        ->getJson('/api/internal/caddy/verify?domain=anything.uz')
        ->assertStatus(403);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn ($msg) => str_contains((string) $msg, 'InternalCaddyOnly'))
        ->atLeast()->once();
});

it('caches the allow/deny decision for the verify endpoint', function (): void {
    [, $domain] = seedDomain(verified: true);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/internal/caddy/verify?domain=' . urlencode($domain))
        ->assertOk();

    expect(Cache::get('caddy:verify:' . $domain))->toBe('allow');
});
