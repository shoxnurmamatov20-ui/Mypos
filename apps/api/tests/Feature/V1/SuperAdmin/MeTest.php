<?php

declare(strict_types=1);

use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/super-admin/me')->assertStatus(401);
});

it('returns 403 for tenant user attempting super-admin /me', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->getJson('/api/v1/super-admin/me')->assertStatus(403);
});

it('returns the authenticated super admin profile', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->getJson('/api/v1/super-admin/me')
        ->assertOk()
        ->assertJsonPath('data.id', $admin->uuid)
        ->assertJsonPath('data.is_super_admin', true);
});

it('logs out and revokes the token', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->postJson('/api/v1/super-admin/logout')->assertOk();
});
