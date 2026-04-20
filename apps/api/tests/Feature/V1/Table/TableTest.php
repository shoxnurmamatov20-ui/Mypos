<?php

declare(strict_types=1);

use App\Domain\Table\Models\Table;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/tables')->assertStatus(401);
});

it('lets an owner list tables (tenant-scoped)', function (): void {
    $owner = actingAsTenantOwner();
    Table::factory()->count(3)->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/tables')->assertOk();

    expect($response->json('data'))->toHaveCount(3);
});

it('lets an owner create a table', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/tables', [
        'name' => 'T-7',
        'capacity' => 4,
        'shape' => 'round',
        'status' => 'available',
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'T-7')
        ->assertJsonPath('data.capacity', 4)
        ->assertJsonPath('data.status', 'available');

    $this->assertDatabaseHas('tables', [
        'tenant_id' => $owner->tenant_id,
        'name' => 'T-7',
        'status' => 'available',
    ]);
});

it('validates required name on create', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/tables', ['capacity' => 4])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

it('lets an owner update table status via PATCH /status', function (): void {
    $owner = actingAsTenantOwner();
    $table = Table::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'available',
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/tables/{$table->id}/status", ['status' => 'occupied'])
        ->assertOk()
        ->assertJsonPath('data.status', 'occupied');

    expect($table->fresh()->status)->toBe('occupied');
});

it('rejects invalid status values', function (): void {
    $owner = actingAsTenantOwner();
    $table = Table::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/tables/{$table->id}/status", ['status' => 'invalid-value'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('accepts all defined status enum values', function (): void {
    $owner = actingAsTenantOwner();
    $table = Table::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    foreach (['available', 'occupied', 'reserved', 'disabled'] as $status) {
        $this->patchJson("/api/v1/tables/{$table->id}/status", ['status' => $status])
            ->assertOk()
            ->assertJsonPath('data.status', $status);
    }
});
