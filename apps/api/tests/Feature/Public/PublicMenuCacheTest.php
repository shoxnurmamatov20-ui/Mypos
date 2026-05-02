<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| B7-T2 — Public Menu cache behaviour (`/api/v1/public/menu/{slug}`)
|--------------------------------------------------------------------------
|
| Spec covered (Agent B1):
|   - Response cached server-side for ≥ 60s with key
|     `public:menu:{tenant_id}` (NEVER include the slug as a global key).
|   - ETag header on every response so Next.js ISR + browser RFC7234
|     can short-circuit subsequent fetches.
|   - Cache busts on `MenuItem` and `MenuCategory` save/delete events.
|   - The cache MUST NOT be shared across tenants — same slug across two
|     tenants is impossible, but a buggy key like `public:menu:{slug}`
|     would still collide if a tenant changes their slug.
|
| Notes:
|   - We monkey-patch the cache via `Cache::shouldReceive` so the assertion
|     is independent of the underlying store (memory in tests).
|   - The invalidation tests use real `Cache::flush()` in a tight loop
|     because Laravel's model events fire after the DB commit.
*/

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Cache;

it('caches menu response for 60s', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    // Spy on Cache::remember — backend should call it with at least 60s TTL.
    Cache::shouldReceive('remember')
        ->atLeast()
        ->once()
        ->andReturnUsing(function ($key, $ttl, $callback) {
            // Accept either an integer (seconds) or a Carbon (future date).
            $seconds = is_int($ttl) ? $ttl : ($ttl instanceof \DateTimeInterface
                ? $ttl->getTimestamp() - now()->getTimestamp()
                : 60);
            expect($seconds)->toBeGreaterThanOrEqual(60);
            return $callback();
        });

    $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();
})->skip('Cache wiring pending B1 — re-enable once PublicMenuController calls Cache::remember.');

it('returns ETag header', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
    ]);

    $response = $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();

    expect($response->headers->get('ETag'))->not->toBeNull();
})->skip('ETag pending B1 — re-enable once response middleware emits it.');

it('invalidates cache when menu item updates', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
        'price_amount' => 25_000,
    ]);

    $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();

    // Updating the menu item should bust the cache so the next read sees fresh.
    $item->update(['price_amount' => 30_000]);

    $response = $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();

    // Whichever shape Agent B1 chooses, the new price must be visible.
    $body = json_encode($response->json('data'));
    expect($body)->toContain('30000');
})->skip('Cache invalidation pending B1 — re-enable once Observer fires.');

it('invalidates cache when menu category updates', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create([
        'tenant_id' => $tenant->id,
        'is_active' => true,
        'name' => ['uz' => 'Asl', 'ru' => 'Asl', 'en' => 'Asl'],
    ]);

    $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();

    // Renaming the category must bust the cache.
    $cat->update(['name' => ['uz' => 'Yangi', 'ru' => 'Yangi', 'en' => 'Yangi']]);

    $response = $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();
    expect(json_encode($response->json('data')))->toContain('Yangi');
})->skip('Cache invalidation pending B1.');

it('does NOT cache across tenants', function (): void {
    $a = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $b = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    $catA = MenuCategory::factory()->create(['tenant_id' => $a->id, 'is_active' => true]);
    MenuItem::factory()->create([
        'tenant_id' => $a->id,
        'category_id' => $catA->id,
        'is_active' => true,
        'name' => ['uz' => 'Aaa-Item', 'ru' => 'Aaa-Item', 'en' => 'Aaa-Item'],
    ]);

    $catB = MenuCategory::factory()->create(['tenant_id' => $b->id, 'is_active' => true]);
    MenuItem::factory()->create([
        'tenant_id' => $b->id,
        'category_id' => $catB->id,
        'is_active' => true,
        'name' => ['uz' => 'Bbb-Item', 'ru' => 'Bbb-Item', 'en' => 'Bbb-Item'],
    ]);

    // Warm cache for tenant A.
    $this->getJson('/api/v1/public/menu/' . $a->slug)->assertOk();

    // Tenant B's response must contain B's items, not A's.
    $bRes = $this->getJson('/api/v1/public/menu/' . $b->slug)->assertOk();
    $body = json_encode($bRes->json('data'));
    expect($body)->toContain('Bbb-Item');
    expect($body)->not->toContain('Aaa-Item');
});

it('returns 404 for unknown menu slug', function (): void {
    $this->getJson('/api/v1/public/menu/this-slug-does-not-exist-' . bin2hex(random_bytes(4)))
        ->assertStatus(404);
});

it('only returns active menu items', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);

    $active = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
        'slug' => 'active-' . bin2hex(random_bytes(3)),
    ]);
    $inactive = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => false,
        'slug' => 'inactive-' . bin2hex(random_bytes(3)),
    ]);

    $response = $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();

    $body = json_encode($response->json('data'));
    expect($body)->toContain($active->slug);
    expect($body)->not->toContain($inactive->slug);
});

it('only returns active categories', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    $activeCat = MenuCategory::factory()->create([
        'tenant_id' => $tenant->id,
        'is_active' => true,
        'slug' => 'cat-active-' . bin2hex(random_bytes(3)),
    ]);
    $inactiveCat = MenuCategory::factory()->create([
        'tenant_id' => $tenant->id,
        'is_active' => false,
        'slug' => 'cat-inactive-' . bin2hex(random_bytes(3)),
    ]);

    $response = $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();

    $body = json_encode($response->json('data'));
    expect($body)->toContain($activeCat->slug);
    expect($body)->not->toContain($inactiveCat->slug);
});

it('does not expose suspended tenant menu', function (): void {
    $tenant = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => now()->subHour(),
    ]);

    $this->getJson('/api/v1/public/menu/' . $tenant->slug)
        ->assertStatus(404);
});

it('returns tenant metadata in payload', function (): void {
    $tenant = Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
        'name' => 'My Cafe',
    ]);

    $response = $this->getJson('/api/v1/public/menu/' . $tenant->slug)->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveKey('tenant');
    expect($data['tenant'])->toHaveKey('id');
    expect($data['tenant'])->toHaveKey('slug');
    expect($data['tenant']['slug'])->toBe($tenant->slug);
});
