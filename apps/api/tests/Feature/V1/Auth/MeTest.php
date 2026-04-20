<?php

declare(strict_types=1);

use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/auth/me')->assertStatus(401);
});

it('returns the authenticated user profile', function (): void {
    $user = actingAsTenantOwner();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/auth/me')->assertOk();

    $response
        ->assertJsonPath('data.id', $user->uuid)
        ->assertJsonPath('data.email', $user->email)
        ->assertJsonPath('data.is_super_admin', false);

    expect($response->json('data.roles'))->toContain('owner');
});

it('includes tenant info when user belongs to a tenant', function (): void {
    $tenant = Tenant::factory()->create(['name' => 'Kafe Test']);
    $user = actingAsTenantOwner($tenant);
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.tenant.name', 'Kafe Test');
});

it('omits tenant for super admin without tenant', function (): void {
    $user = actingAsSuperAdmin();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/auth/me')->assertOk();

    expect($response->json('data.is_super_admin'))->toBeTrue();
    expect($response->json('data.tenant'))->toBeNull();
});

it('logs out and invalidates token', function (): void {
    $user = actingAsTenantOwner();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/auth/logout')->assertOk();
});
