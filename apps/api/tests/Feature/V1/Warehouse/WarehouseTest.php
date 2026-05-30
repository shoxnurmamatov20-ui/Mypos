<?php

declare(strict_types=1);

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Warehouse\Models\Warehouse;
use Laravel\Sanctum\Sanctum;

it('rejects unauthenticated access to warehouses', function (): void {
    $this->getJson('/api/v1/warehouses')->assertStatus(401);
});

it('lets an owner list warehouses paginated', function (): void {
    $owner = actingAsTenantOwner();
    Warehouse::factory()->count(3)->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/warehouses')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);

    expect($response->json('data'))->toHaveCount(3);
});

it('scopes warehouse list to the current tenant', function (): void {
    $owner = actingAsTenantOwner();
    Warehouse::factory()->count(2)->create(['tenant_id' => $owner->tenant_id]);

    $other = Tenant::factory()->create();
    Warehouse::factory()->count(5)->create(['tenant_id' => $other->id]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/warehouses')->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('creates a warehouse', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/warehouses', [
        'name' => 'Sovutgich ombor',
        'address' => 'Toshkent, Yashnobod 5',
        'is_active' => true,
        'is_default' => false,
        'sort_order' => 10,
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Sovutgich ombor')
        ->assertJsonPath('data.is_default', false);

    $this->assertDatabaseHas('warehouses', [
        'tenant_id' => $owner->tenant_id,
        'name' => 'Sovutgich ombor',
    ]);
});

it('only allows one default warehouse per tenant', function (): void {
    $owner = actingAsTenantOwner();

    $oldDefault = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/warehouses', [
        'name' => 'Yangi asosiy',
        'is_default' => true,
    ])->assertCreated();

    // Old default should have been demoted.
    expect($oldDefault->fresh()->is_default)->toBeFalse();
    // Only one default remains.
    $defaultCount = Warehouse::query()
        ->where('tenant_id', $owner->tenant_id)
        ->where('is_default', true)
        ->count();
    expect($defaultCount)->toBe(1);
});

it('updates a warehouse', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/warehouses/{$warehouse->id}", [
        'name' => 'Yangi nom',
        'address' => 'Yangi manzil',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Yangi nom');

    $this->assertDatabaseHas('warehouses', [
        'id' => $warehouse->id,
        'name' => 'Yangi nom',
    ]);
});

it('refuses to delete the default warehouse', function (): void {
    $owner = actingAsTenantOwner();
    $defaultWh = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->deleteJson("/api/v1/warehouses/{$defaultWh->id}")
        ->assertStatus(403);

    expect(Warehouse::query()->find($defaultWh->id))->not->toBeNull();
});

it('deletes a non-default warehouse', function (): void {
    $owner = actingAsTenantOwner();
    $wh = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id, 'is_default' => false]);

    Sanctum::actingAs($owner);

    $this->deleteJson("/api/v1/warehouses/{$wh->id}")->assertOk();

    expect(Warehouse::query()->find($wh->id))->toBeNull();
});

it('returns 404 for warehouses belonging to other tenants', function (): void {
    $owner = actingAsTenantOwner();
    $other = Tenant::factory()->create();
    $otherWh = Warehouse::factory()->create(['tenant_id' => $other->id]);

    Sanctum::actingAs($owner);

    $this->getJson("/api/v1/warehouses/{$otherWh->id}")
        ->assertStatus(404);
});
