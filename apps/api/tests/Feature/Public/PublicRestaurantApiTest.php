<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| B7-T1 — Public Restaurant API (`/api/v1/public/restaurants`)
|--------------------------------------------------------------------------
|
| Spec covered (Agent B1):
|   GET /api/v1/public/restaurants — paginated marketplace list, no auth.
|   GET /api/v1/public/restaurants/{slug} — single restaurant detail.
|
| Invariants tested:
|   - Returns paginated envelope `{ data: [...], meta: { ... } }`.
|   - Filters honour `?cuisine=`, `?q=`, `?location=lat,lng` (geo-distance).
|   - Only `status=active && suspended_at IS NULL` tenants leak through.
|   - Rate-limit: 60 req/min per IP (Laravel `throttle:60,1`).
|   - Response cached for 60s (Cache::remember on a tenant-scoped key).
|   - Unknown slug → 404 with "Restoran topilmadi" message.
|
| Cache assertions use `Cache::shouldReceive('remember')` so they're
| deterministic regardless of the underlying store.
*/

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function (): void {
    RateLimiter::clear('public-restaurants:127.0.0.1');
});

it('GET /api/v1/public/restaurants returns paginated list', function (): void {
    Tenant::factory()->count(3)->create([
        'status' => 'active',
        'suspended_at' => null,
    ]);

    $response = $this->getJson('/api/v1/public/restaurants')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'slug', 'name'],
            ],
            'meta',
        ]);

    expect($response->json('data'))->toBeArray();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(3);
})->skip('Endpoint pending B1 — re-enable once /api/v1/public/restaurants is wired.');

it('respects ?location filter (geo distance)', function (): void {
    // The endpoint accepts `location=lat,lng`. Backend should sort by
    // proximity and (optionally) include `distance_km` on each row.
    Tenant::factory()->count(2)->create([
        'status' => 'active',
        'suspended_at' => null,
    ]);

    $tashkent = '41.2995,69.2401';
    $response = $this->getJson('/api/v1/public/restaurants?location=' . $tashkent)
        ->assertOk();

    // Geo response shape is decided by B1; we only assert it doesn't 500
    // and the envelope is intact.
    expect($response->json('data'))->toBeArray();
})->skip('Endpoint pending B1.');

it('respects ?cuisine filter', function (): void {
    Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
        'settings' => ['cuisine' => 'uzbek'],
    ]);
    Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
        'settings' => ['cuisine' => 'pizza'],
    ]);

    $response = $this->getJson('/api/v1/public/restaurants?cuisine=uzbek')
        ->assertOk();

    expect($response->json('data'))->toBeArray();
})->skip('Cuisine filter pending B1 — re-enable once filter logic is wired.');

it('respects ?search query', function (): void {
    Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
        'name' => 'Osh Markazi',
        'slug' => 'osh-markazi-' . bin2hex(random_bytes(3)),
    ]);

    Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
        'name' => 'Plov Club',
        'slug' => 'plov-club-' . bin2hex(random_bytes(3)),
    ]);

    $response = $this->getJson('/api/v1/public/restaurants?q=Osh')
        ->assertOk();

    $names = collect($response->json('data'))->pluck('name')->all();
    // At least one of the names must match the search term — backend may
    // localize but should include the matching tenant.
    expect(implode(' ', array_map(fn ($n) => is_array($n) ? json_encode($n) : (string) $n, $names)))
        ->toContain('Osh');
})->skip('Endpoint pending B1.');

it('returns only active restaurants', function (): void {
    $active = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
    ]);
    $suspended = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => now(),
    ]);
    $inactive = Tenant::factory()->create([
        'status' => 'suspended',
        'suspended_at' => null,
    ]);

    $response = $this->getJson('/api/v1/public/restaurants')->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($suspended->id);
    expect($ids)->not->toContain($inactive->id);
})->skip('Endpoint pending B1.');

it('respects rate limit 60/min per IP', function (): void {
    Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    // Hit the endpoint 60 times — all should succeed.
    for ($i = 0; $i < 60; $i++) {
        $this->getJson('/api/v1/public/restaurants')->assertOk();
    }

    // 61st call should hit the throttle.
    $response = $this->getJson('/api/v1/public/restaurants');
    expect($response->status())->toBe(429);
})->skip('Throttle middleware bypassed in test env until B1 wires it.');

it('caches response for 60 seconds', function (): void {
    Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    Cache::shouldReceive('remember')
        ->atLeast()
        ->once()
        ->andReturnUsing(function ($key, $ttl, $callback) {
            // TTL must be ~60 seconds (allow 60-300 since menu vs restaurant
            // both use Cache::remember with similar window).
            expect($ttl)->toBeGreaterThanOrEqual(60);
            return $callback();
        });

    $this->getJson('/api/v1/public/restaurants')->assertOk();
})->skip('Cache layer pending B1 implementation — re-enable once Cache::remember is wired.');

it('returns 404 for unknown slug', function (): void {
    $this->getJson('/api/v1/public/restaurants/this-slug-does-not-exist-' . bin2hex(random_bytes(4)))
        ->assertStatus(404);
})->skip('Endpoint pending B1.');

it('returns single restaurant by slug', function (): void {
    $tenant = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
    ]);

    $response = $this->getJson('/api/v1/public/restaurants/' . $tenant->slug)
        ->assertOk()
        ->assertJsonPath('data.id', $tenant->id)
        ->assertJsonPath('data.slug', $tenant->slug);

    expect($response->json('data'))->toHaveKey('name');
})->skip('Endpoint pending B1.');

it('does not expose suspended tenant by slug', function (): void {
    $tenant = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => now(),
    ]);

    $this->getJson('/api/v1/public/restaurants/' . $tenant->slug)
        ->assertStatus(404);
})->skip('Endpoint pending B1.');
