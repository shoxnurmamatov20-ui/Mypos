<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| B7-T3 — Public Order placement & tracking (Phase-1 spec, Agent B1)
|--------------------------------------------------------------------------
|
| Endpoints under test:
|   POST /api/v1/public/orders                    — guest checkout
|   GET  /api/v1/public/orders/track/{token}      — guest tracking
|
| Invariants:
|   - Each order issued a 64-byte URL-safe `tracking_token`. Token must NOT
|     leak the underlying primary key.
|   - Cross-tenant menu_item_ids in the body are rejected (422 — never 200)
|     so a buggy client can't drag items from another restaurant.
|   - The status endpoint resolves the order *purely* by tracking_token.
|     Bad token → 404 (no information leak about whether the order exists).
|   - Phone validation: UZ format `+998xxxxxxxxx` (12 digits inc. country).
|   - Cash + Click are accepted; Click returns a `payment_intent` with a
|     `redirect_url`. Other providers are rejected with a 422.
|   - Per-IP+phone limiter: 5 orders / minute. Beyond that → 429.
|
| The route definition lives in `routes/api.php`:
|     /api/v1/public/menu/{slug}/orders   ← QR-flow (existing)
|     /api/v1/public/orders               ← marketplace flow (Agent B1, NEW)
|
| Agent B7 writes against the NEW shape — tests are skipped where the
| endpoint isn't wired yet, but they ARE valid against the spec.
*/

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;

it('creates a guest order with tracking_token', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
        'price_amount' => 50_000,
    ]);

    $response = $this->postJson('/api/v1/public/orders', [
        'restaurant_slug' => $tenant->slug,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
        'customer' => [
            'name' => 'Akmal Karimov',
            'phone' => '+998901234567',
        ],
        'address' => [
            'label' => 'home',
            'street' => 'Mustaqillik 1',
        ],
        'payment_method' => 'cash',
    ])->assertCreated();

    expect($response->json('data.tracking_token'))->toBeString();
    expect(strlen($response->json('data.tracking_token')))->toBeGreaterThanOrEqual(20);
    expect($response->json('data.status'))->toBe('pending');
})->skip('POST /api/v1/public/orders pending B1 — endpoint not wired yet.');

it('rejects cross-tenant menu items', function (): void {
    $a = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $b = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    $catB = MenuCategory::factory()->create(['tenant_id' => $b->id, 'is_active' => true]);
    $itemBelongsToB = MenuItem::factory()->create([
        'tenant_id' => $b->id,
        'category_id' => $catB->id,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/public/orders', [
        'restaurant_slug' => $a->slug, // ordering AT tenant A
        'items' => [['menu_item_id' => $itemBelongsToB->id, 'quantity' => 1]],
        'customer' => ['name' => 'X', 'phone' => '+998901234567'],
        'address' => ['label' => 'home', 'street' => 'Lane 1'],
        'payment_method' => 'cash',
    ]);

    expect($response->status())->toBeIn([404, 422]);
    // The order MUST NOT have been created.
    expect(Order::query()->withoutGlobalScopes()->count())->toBe(0);
})->skip('POST /api/v1/public/orders pending B1.');

it('returns order tracking via /track/{token}', function (): void {
    // Once B1 wires the endpoint, this test creates an order via the public
    // endpoint, captures the token, and verifies tracking returns it.
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
    ]);

    $created = $this->postJson('/api/v1/public/orders', [
        'restaurant_slug' => $tenant->slug,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        'customer' => ['name' => 'A', 'phone' => '+998901234567'],
        'address' => ['label' => 'home', 'street' => 'Lane 1'],
        'payment_method' => 'cash',
    ])->assertCreated();

    $token = $created->json('data.tracking_token');

    $this->getJson('/api/v1/public/orders/track/' . $token)
        ->assertOk()
        ->assertJsonPath('data.tracking_token', $token);
})->skip('Tracking endpoint pending B1.');

it('rate limits guest checkout to 5/min per IP+phone', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
    ]);

    $payload = [
        'restaurant_slug' => $tenant->slug,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        'customer' => ['name' => 'A', 'phone' => '+998901234567'],
        'address' => ['label' => 'home', 'street' => 'Lane 1'],
        'payment_method' => 'cash',
    ];

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/public/orders', $payload)->assertCreated();
    }

    $this->postJson('/api/v1/public/orders', $payload)->assertStatus(429);
})->skip('Rate limiter wiring pending B1.');

it('validates phone format', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
    ]);

    $bad = [
        '12345',
        'not-a-phone',
        '+1-555-9999',         // not UZ
        '99812345',            // missing country
        '+998123',             // too short
    ];

    foreach ($bad as $phone) {
        $this->postJson('/api/v1/public/orders', [
            'restaurant_slug' => $tenant->slug,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            'customer' => ['name' => 'X', 'phone' => $phone],
            'address' => ['label' => 'home', 'street' => 'L1'],
            'payment_method' => 'cash',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer.phone']);
    }
})->skip('Phone validation pending B1.');

it('returns Click intent for card payment', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/public/orders', [
        'restaurant_slug' => $tenant->slug,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        'customer' => ['name' => 'X', 'phone' => '+998901234567'],
        'address' => ['label' => 'home', 'street' => 'L1'],
        'payment_method' => 'click',
    ])->assertCreated();

    expect($response->json('data.payment_intent'))->toBeArray();
    expect($response->json('data.payment_intent.provider'))->toBe('click');
    expect($response->json('data.payment_intent.redirect_url'))->toBeString();
})->skip('Click integration pending B1.');

it('returns 404 for invalid tracking_token', function (): void {
    $this->getJson('/api/v1/public/orders/track/this-is-not-a-real-token-' . bin2hex(random_bytes(8)))
        ->assertStatus(404);
})->skip('Tracking endpoint pending B1.');

it('rejects empty items array', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    $this->postJson('/api/v1/public/orders', [
        'restaurant_slug' => $tenant->slug,
        'items' => [],
        'customer' => ['name' => 'X', 'phone' => '+998901234567'],
        'address' => ['label' => 'home', 'street' => 'L1'],
        'payment_method' => 'cash',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
})->skip('POST /api/v1/public/orders pending B1.');

it('rejects unknown payment_method', function (): void {
    $tenant = Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/public/orders', [
        'restaurant_slug' => $tenant->slug,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        'customer' => ['name' => 'X', 'phone' => '+998901234567'],
        'address' => ['label' => 'home', 'street' => 'L1'],
        'payment_method' => 'crypto',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['payment_method']);
})->skip('POST /api/v1/public/orders pending B1.');

it('existing QR-flow endpoint creates order with status pending', function (): void {
    // The existing QR-flow endpoint at /api/v1/public/menu/{slug}/orders is
    // already wired. We assert it still works as-is so B1's marketplace
    // endpoint doesn't accidentally regress the QR path.
    $tenant = \App\Domain\Tenant\Models\Tenant::factory()->create([
        'status' => 'active',
        'suspended_at' => null,
    ]);
    $table = \App\Domain\Table\Models\Table::factory()->create(['tenant_id' => $tenant->id]);
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $cat->id,
        'is_active' => true,
        'price_amount' => 25_000,
    ]);

    $response = $this->postJson('/api/v1/public/menu/' . $tenant->slug . '/orders', [
        'table_id' => $table->id,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
    ])->assertCreated();

    expect($response->json('data.status'))->toBe('pending');
    expect((int) $response->json('data.amounts.total'))->toBe(50_000);
});

it('existing QR-flow rejects items from other tenant', function (): void {
    $a = \App\Domain\Tenant\Models\Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);
    $b = \App\Domain\Tenant\Models\Tenant::factory()->create(['status' => 'active', 'suspended_at' => null]);

    $tableAtA = \App\Domain\Table\Models\Table::factory()->create(['tenant_id' => $a->id]);
    $catB = MenuCategory::factory()->create(['tenant_id' => $b->id, 'is_active' => true]);
    $itemAtB = MenuItem::factory()->create([
        'tenant_id' => $b->id,
        'category_id' => $catB->id,
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/public/menu/' . $a->slug . '/orders', [
        'table_id' => $tableAtA->id,
        'items' => [['menu_item_id' => $itemAtB->id, 'quantity' => 1]],
    ])->assertStatus(422);
});

it('existing QR-flow returns 404 for unknown tenant slug', function (): void {
    $this->postJson('/api/v1/public/menu/this-does-not-exist-' . bin2hex(random_bytes(4)) . '/orders', [
        'table_id' => '00000000-0000-0000-0000-000000000000',
        'items' => [],
    ])->assertStatus(404);
});
