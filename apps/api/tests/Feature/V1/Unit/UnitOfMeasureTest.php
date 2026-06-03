<?php

declare(strict_types=1);

use App\Domain\Unit\Models\UnitOfMeasure;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/units')->assertStatus(401);
});

it('lets an owner list units (tenant-scoped, paginated)', function (): void {
    $owner = actingAsTenantOwner();
    UnitOfMeasure::factory()->count(4)->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/units')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);

    expect($response->json('data'))->toHaveCount(4);
});

it('lets an owner create a unit with valid data', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/units', [
        'name' => 'Kilogramm',
        'abbreviation' => 'kg',
        'type' => 'weight',
        'is_active' => true,
        'sort_order' => 1,
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Kilogramm')
        ->assertJsonPath('data.abbreviation', 'kg')
        ->assertJsonPath('data.type', 'weight')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('units_of_measure', [
        'tenant_id' => $owner->tenant_id,
        'name' => 'Kilogramm',
        'abbreviation' => 'kg',
        'type' => 'weight',
    ]);
});

it('rejects create when name is missing', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/units', [
        'abbreviation' => 'kg',
        'type' => 'weight',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

it('rejects create when abbreviation is missing', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/units', [
        'name' => 'Kilogramm',
        'type' => 'weight',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['abbreviation']);
});

it('rejects create with an invalid type', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/units', [
        'name' => 'Kilogramm',
        'abbreviation' => 'kg',
        'type' => 'banana',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['type']);
});

it('updates a unit via PATCH', function (): void {
    $owner = actingAsTenantOwner();
    $unit = UnitOfMeasure::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Litr',
        'type' => 'volume',
    ]);

    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/units/{$unit->id}", ['name' => 'Litr (yangilangan)'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Litr (yangilangan)');

    $this->assertDatabaseHas('units_of_measure', [
        'id' => $unit->id,
        'name' => 'Litr (yangilangan)',
    ]);
});

it('soft-deletes a unit', function (): void {
    $owner = actingAsTenantOwner();
    $unit = UnitOfMeasure::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->deleteJson("/api/v1/units/{$unit->id}")->assertOk();

    $this->assertSoftDeleted('units_of_measure', ['id' => $unit->id]);
});

it('isolates another tenant units (no cross-tenant access)', function (): void {
    $owner = actingAsTenantOwner();
    $foreign = \App\Domain\Unit\Models\UnitOfMeasure::factory()->create();
    \Laravel\Sanctum\Sanctum::actingAs($owner);
    $this->getJson('/api/v1/units')->assertOk()->assertJsonMissing(['id' => $foreign->id]);
    $this->getJson("/api/v1/units/{$foreign->id}")->assertStatus(404);
    $this->patchJson("/api/v1/units/{$foreign->id}", ['name' => 'x'])->assertStatus(404);
    $this->deleteJson("/api/v1/units/{$foreign->id}")->assertStatus(404);
});
