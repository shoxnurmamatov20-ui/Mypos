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

it('lists tenants with pagination', function (): void {
    Tenant::factory()->count(5)->create();

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/tenants?per_page=3')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta', 'links']);

    expect(count($response->json('data')))->toBe(3);
});

it('filters tenants by status', function (): void {
    Tenant::factory()->count(2)->create(['subscription_status' => 'active']);
    Tenant::factory()->count(3)->create(['subscription_status' => 'suspended']);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/tenants?status=suspended&per_page=50')
        ->assertOk();

    expect(count($response->json('data')))->toBe(3);
});

it('filters tenants by plan', function (): void {
    Tenant::factory()->count(2)->create(['subscription_plan' => 'pro', 'plan' => 'pro']);
    Tenant::factory()->count(1)->create(['subscription_plan' => 'starter', 'plan' => 'starter']);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/tenants?plan=pro&per_page=50')->assertOk();

    expect(count($response->json('data')))->toBe(2);
});

it('searches tenants by query string', function (): void {
    Tenant::factory()->create(['name' => 'Osh Markazi', 'slug' => 'osh-markazi-' . uniqid()]);
    Tenant::factory()->create(['name' => 'Plov Club', 'slug' => 'plov-club-' . uniqid()]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/tenants?q=Osh&per_page=50')->assertOk();

    expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

it('shows full tenant detail', function (): void {
    $tenant = Tenant::factory()->create();
    $owner = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $owner->assignRole('owner');

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/tenants/' . $tenant->id)->assertOk();

    expect($response->json('data.tenant.id'))->toBe($tenant->id);
    expect($response->json('data.owner.email'))->toBe($owner->email);
    expect($response->json('data.stats'))->toBeArray();
});

it('creates a new tenant + owner', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $payload = [
        'name' => 'New Restaurant',
        'slug' => 'new-restaurant-' . uniqid(),
        'owner_name' => 'Owner Name',
        'owner_email' => 'owner+' . uniqid() . '@test.uz',
        'owner_phone' => '+998901234567',
        'owner_password' => 'secure-pass-9',
        'plan' => 'starter',
        'trial_days' => 14,
    ];

    $response = $this->postJson('/api/v1/super-admin/tenants', $payload)
        ->assertCreated();

    expect($response->json('data.tenant.name'))->toBe('New Restaurant');
    expect($response->json('data.owner.email'))->toBe($payload['owner_email']);

    expect(AuditLog::query()->where('action', 'tenant.created')->count())->toBe(1);
    expect(User::query()->where('email', $payload['owner_email'])->exists())->toBeTrue();
});

it('rejects duplicate slug on create', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    Tenant::factory()->create(['slug' => 'taken-slug']);

    $this->postJson('/api/v1/super-admin/tenants', [
        'name' => 'Another',
        'slug' => 'taken-slug',
        'owner_name' => 'X',
        'owner_email' => 'x@test.uz',
        'owner_password' => 'secure-pass-9',
    ])->assertStatus(422)->assertJsonValidationErrors(['slug']);
});

it('updates tenant fields', function (): void {
    $tenant = Tenant::factory()->create(['subscription_plan' => 'starter']);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->patchJson('/api/v1/super-admin/tenants/' . $tenant->id, [
        'subscription_plan' => 'pro',
        'mrr_minor' => 1_290_000,
        'notes' => 'Upgraded',
    ])->assertOk()
        ->assertJsonPath('data.subscription_plan', 'pro')
        ->assertJsonPath('data.mrr_minor', 1_290_000);

    expect(AuditLog::query()->where('action', 'tenant.updated')->count())->toBe(1);
});

it('suspends a tenant', function (): void {
    $tenant = Tenant::factory()->create(['subscription_status' => 'active']);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->postJson('/api/v1/super-admin/tenants/' . $tenant->id . '/suspend', [
        'reason' => 'non_payment',
        'notes' => '30 days overdue',
    ])->assertOk()
        ->assertJsonPath('data.subscription_status', 'suspended')
        ->assertJsonPath('data.suspension_reason', 'non_payment');

    expect(AuditLog::query()->where('action', 'tenant.suspended')->count())->toBe(1);
});

it('resumes a suspended tenant', function (): void {
    $tenant = Tenant::factory()->create([
        'subscription_status' => 'suspended',
        'suspended_at' => now()->subDay(),
        'suspension_reason' => 'non_payment',
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->postJson('/api/v1/super-admin/tenants/' . $tenant->id . '/resume')
        ->assertOk()
        ->assertJsonPath('data.subscription_status', 'active')
        ->assertJsonPath('data.suspended_at', null)
        ->assertJsonPath('data.suspension_reason', null);

    expect(AuditLog::query()->where('action', 'tenant.resumed')->count())->toBe(1);
});
