<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/menu/items')->assertStatus(401);
});

it('lets an owner list menu items (paginated)', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    MenuItem::factory()->count(4)->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
    ]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/menu/items')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);

    expect($response->json('data'))->toHaveCount(4);
});

it('lets an owner create a menu item with valid data', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/items', [
        'category_id' => $category->id,
        'name' => ['uz' => 'Osh', 'ru' => 'Плов', 'en' => 'Pilaf'],
        'price_amount' => 35000,
        'price_currency' => 'UZS',
    ])
        ->assertCreated()
        ->assertJsonPath('data.price.amount', 35000)
        ->assertJsonPath('data.price.currency', 'UZS');

    $this->assertDatabaseHas('menu_items', [
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'price_amount' => 35000,
    ]);
});

it('rejects create when price_amount is missing', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/items', [
        'category_id' => $category->id,
        'name' => ['uz' => 'X', 'ru' => 'X', 'en' => 'X'],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price_amount']);
});

it('rejects negative price_amount', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/items', [
        'category_id' => $category->id,
        'name' => ['uz' => 'X', 'ru' => 'X', 'en' => 'X'],
        'price_amount' => -100,
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price_amount']);
});

it('rejects category_id that does not exist', function (): void {
    // Note: cross-tenant category rejection should be enforced via exists() with
    // tenant scope OR a custom Rule — currently the exists rule is global. See
    // report for the backend refactor suggestion. Here we test the baseline:
    // completely unknown UUIDs are rejected.
    $owner = actingAsTenantOwner();

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/items', [
        'category_id' => '00000000-0000-0000-0000-000000000000',
        'name' => ['uz' => 'X', 'ru' => 'X', 'en' => 'X'],
        'price_amount' => 5000,
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['category_id']);
});

it('filters by category_id', function (): void {
    $owner = actingAsTenantOwner();
    $catA = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $catB = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);

    MenuItem::factory()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $catA->id,
    ]);
    MenuItem::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $catB->id,
    ]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/menu/items?category_id=' . $catB->id)->assertOk();

    expect($response->json('data'))->toHaveCount(3);
});

it('filters by search query (q)', function (): void {
    $owner = actingAsTenantOwner();
    $cat = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);

    MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $cat->id,
        'name' => ['uz' => 'Qaynoq osh', 'ru' => 'Горячий плов', 'en' => 'Hot pilaf'],
        'slug' => 'qaynoq-osh-' . bin2hex(random_bytes(3)),
    ]);
    MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $cat->id,
        'name' => ['uz' => 'Shashlik', 'ru' => 'Шашлык', 'en' => 'Kebab'],
        'slug' => 'shashlik-' . bin2hex(random_bytes(3)),
    ]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/menu/items?q=osh')->assertOk();

    expect(collect($response->json('data'))->pluck('slug')->all())
        ->toContain(MenuItem::where('slug', 'like', 'qaynoq-osh-%')->first()->slug);
});
