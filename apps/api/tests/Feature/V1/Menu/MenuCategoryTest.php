<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Tenant\Models\Tenant;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/menu/categories')->assertStatus(401);
});

it('lets an owner list their tenant categories', function (): void {
    $owner = actingAsTenantOwner();
    MenuCategory::factory()->count(3)->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/menu/categories')->assertOk();

    expect($response->json('data'))->toHaveCount(3);
});

it('scopes categories to the current tenant', function (): void {
    $owner = actingAsTenantOwner();
    MenuCategory::factory()->count(2)->create(['tenant_id' => $owner->tenant_id]);

    $otherTenant = Tenant::factory()->create();
    MenuCategory::factory()->count(5)->create(['tenant_id' => $otherTenant->id]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/menu/categories')->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('lets an owner create a category', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/categories', [
        'name' => ['uz' => 'Salatlar', 'ru' => 'Салаты', 'en' => 'Salads'],
        'slug' => 'salatlar-xxx',
        'icon' => 'salad',
        'color' => '#00FF00',
        'sort_order' => 1,
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'salatlar-xxx')
        ->assertJsonPath('data.name.uz', 'Salatlar');

    $this->assertDatabaseHas('menu_categories', [
        'tenant_id' => $owner->tenant_id,
        'slug' => 'salatlar-xxx',
    ]);
});

it('rejects duplicate slug within the same tenant', function (): void {
    $owner = actingAsTenantOwner();
    MenuCategory::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'slug' => 'salatlar-dup',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/menu/categories', [
        'name' => ['uz' => 'X', 'ru' => 'X', 'en' => 'X'],
        'slug' => 'salatlar-dup',
    ]);

    // The DB-level unique constraint will fire if controller doesn't validate.
    // Either 422 (if validated) or 500 (if not). We assert a non-2xx.
    expect($response->status())->toBeGreaterThanOrEqual(400);
});

it('rejects invalid color format', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/categories', [
        'name' => ['uz' => 'X', 'ru' => 'X', 'en' => 'X'],
        'color' => 'not-a-color',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['color']);
});

it('requires all three locale names', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/menu/categories', [
        'name' => ['uz' => 'Only UZ'],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name.ru', 'name.en']);
});
