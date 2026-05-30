<?php

declare(strict_types=1);

use App\Domain\Department\Models\Department;
use App\Domain\Tenant\Models\Tenant;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/departments')->assertStatus(401);
});

it('lets an owner list their tenant departments', function (): void {
    $owner = actingAsTenantOwner();
    Department::create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Kitchen',
    ]);
    Department::create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Bar',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/departments')->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('scopes departments to the current tenant', function (): void {
    $owner = actingAsTenantOwner();
    Department::create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Hall',
    ]);

    $otherTenant = Tenant::factory()->create();
    Department::create([
        'tenant_id' => $otherTenant->id,
        'name' => 'Stranger',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/departments')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Hall');
});

it('lets an owner create a department', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/departments', [
        'name' => '   Kitchen   ',
        'description' => 'Main cooking station',
        'sort_order' => 1,
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Kitchen')
        ->assertJsonPath('data.description', 'Main cooking station')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('departments', [
        'tenant_id' => $owner->tenant_id,
        'name' => 'Kitchen',
    ]);
});

it('rejects duplicate name within the same tenant (case-insensitive)', function (): void {
    $owner = actingAsTenantOwner();
    Department::create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Kitchen',
    ]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/departments', [
        'name' => 'kitchen',
    ])->assertStatus(422)->assertJsonValidationErrors(['name']);
});

it('lets an owner update a department', function (): void {
    $owner = actingAsTenantOwner();
    $dept = Department::create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Old name',
    ]);

    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/departments/{$dept->id}", [
        'name' => 'New name',
        'is_active' => false,
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'New name')
        ->assertJsonPath('data.is_active', false);
});

it('lets an owner delete an empty department', function (): void {
    $owner = actingAsTenantOwner();
    $dept = Department::create([
        'tenant_id' => $owner->tenant_id,
        'name' => 'Delete me',
    ]);

    Sanctum::actingAs($owner);

    $this->deleteJson("/api/v1/departments/{$dept->id}")->assertOk();

    $this->assertSoftDeleted('departments', ['id' => $dept->id]);
});

it('requires name field on create', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/departments', [
        'description' => 'Missing name',
    ])->assertStatus(422)->assertJsonValidationErrors(['name']);
});

it('filters departments by is_active', function (): void {
    $owner = actingAsTenantOwner();
    Department::create(['tenant_id' => $owner->tenant_id, 'name' => 'A', 'is_active' => true]);
    Department::create(['tenant_id' => $owner->tenant_id, 'name' => 'B', 'is_active' => false]);

    Sanctum::actingAs($owner);

    $active = $this->getJson('/api/v1/departments?is_active=1')->assertOk();
    expect($active->json('data'))->toHaveCount(1)
        ->and($active->json('data.0.name'))->toBe('A');

    $inactive = $this->getJson('/api/v1/departments?is_active=0')->assertOk();
    expect($inactive->json('data'))->toHaveCount(1)
        ->and($inactive->json('data.0.name'))->toBe('B');
});

it('searches departments by name', function (): void {
    $owner = actingAsTenantOwner();
    Department::create(['tenant_id' => $owner->tenant_id, 'name' => 'Kitchen']);
    Department::create(['tenant_id' => $owner->tenant_id, 'name' => 'Bar']);

    Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/departments?q=kit')->assertOk();
    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.name'))->toBe('Kitchen');
});
