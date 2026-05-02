<?php

declare(strict_types=1);

use App\Domain\SuperAdmin\Models\AuditLog;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');
});

it('issues a 1-hour impersonation token for the tenant owner', function (): void {
    $tenant = Tenant::factory()->create();
    $owner = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $owner->assignRole('owner');

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->postJson('/api/v1/super-admin/tenants/' . $tenant->id . '/impersonate')
        ->assertOk()
        ->assertJsonStructure(['data' => ['token', 'user', 'tenant', 'expires_at']]);

    expect($response->json('data.user.id'))->toBe($owner->uuid);
    expect($response->json('data.tenant.id'))->toBe($tenant->id);

    expect(AuditLog::query()->where('action', 'tenant.impersonated')->count())->toBe(1);

    // Token should be persisted with the impersonation:{super_admin_id} name
    $tokenName = 'impersonation:' . $admin->id;
    $persisted = $owner->tokens()->where('name', $tokenName)->first();
    expect($persisted)->not->toBeNull();
    expect($persisted->expires_at)->not->toBeNull();
});

it('returns 422 if tenant has no users to impersonate', function (): void {
    $tenant = Tenant::factory()->create();

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->postJson('/api/v1/super-admin/tenants/' . $tenant->id . '/impersonate')
        ->assertStatus(422);
});
