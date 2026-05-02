<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — Custom Domain admin API
|--------------------------------------------------------------------------
|
| Spec covered (Agent C3 — `/api/v1/admin/domains`):
|
|   GET    /admin/domains                — list current tenant's domains
|   POST   /admin/domains                — create domain row, generate token
|   GET    /admin/domains/{id}           — show single (+ verification proof)
|   POST   /admin/domains/{id}/verify    — trigger DNS check
|   POST   /admin/domains/{id}/set-primary — switch primary
|   DELETE /admin/domains/{id}           — soft-delete
|
| Tier-gating:
|   - Custom-domain feature is Plus+. Free + Pro tenants get 403/422 on POST.
|
| Cross-tenant safety:
|   - Lookups by id must never expose another tenant's domain (404, not 403,
|     to prevent enumeration).
|
| All assertions skip until Agent C3 wires the routes.
*/

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');

    $hasIndex = \Illuminate\Support\Facades\Route::has('v1.admin.domains.index');
    $hasStore = \Illuminate\Support\Facades\Route::has('v1.admin.domains.store');
    if (! $hasIndex && ! $hasStore) {
        $this->markTestSkipped('Domain admin endpoints not yet wired (pending Agent C3).');
    }
});

it('GET /admin/domains lists only current tenant domains', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    // Mine
    TenantDomain::query()->create([
        'tenant_id' => $owner->tenant_id,
        'domain' => 'mine-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    // Stranger's
    $stranger = Tenant::factory()->create();
    TenantDomain::query()->create([
        'tenant_id' => $stranger->id,
        'domain' => 'stranger-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('b', 40),
    ]);

    $response = $this->getJson('/api/v1/admin/domains')->assertOk();
    $tenantIds = collect($response->json('data'))->pluck('tenant_id')->unique()->all();

    expect($tenantIds)->toBeArray();
    foreach ($tenantIds as $id) {
        expect($id)->toBe($owner->tenant_id);
    }
});

it('POST /admin/domains creates a new domain with generated verification_token', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/admin/domains', [
        'domain' => 'new-' . bin2hex(random_bytes(3)) . '.uz',
    ])->assertCreated();

    $token = $response->json('data.verification_token');
    expect($token)->toBeString();
    expect(str_starts_with($token, 'mypos-verify-'))->toBeTrue();
    expect($response->json('data.is_verified'))->toBeFalse();
});

it('POST /admin/domains validates the domain format', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/admin/domains', [
        'domain' => 'not a valid host',
    ])->assertStatus(422)->assertJsonValidationErrors(['domain']);
});

it('POST /admin/domains rejects domain already taken by another tenant', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $stranger = Tenant::factory()->create();
    $shared = 'shared-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $stranger->id,
        'domain' => $shared,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $response = $this->postJson('/api/v1/admin/domains', [
        'domain' => $shared,
    ]);

    expect($response->status())->toBeIn([409, 422]);
});

it('POST /admin/domains rejects requests from free tier (tier-gate)', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'free'])->save();
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/admin/domains', [
        'domain' => 'free-' . bin2hex(random_bytes(3)) . '.uz',
    ]);

    expect($response->status())->toBeIn([402, 403, 422]);
});

it('POST /admin/domains rejects requests from pro tier (tier-gate)', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'pro'])->save();
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/admin/domains', [
        'domain' => 'pro-' . bin2hex(random_bytes(3)) . '.uz',
    ]);

    expect($response->status())->toBeIn([402, 403, 422]);
});

it('POST /admin/domains allows plus tier to add a single domain', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/admin/domains', [
        'domain' => 'plus-' . bin2hex(random_bytes(3)) . '.uz',
    ])->assertCreated();
});

it('POST /admin/domains enforces max-domains limit per tier', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    // Plus is allowed 1 domain (per spec); seed it then attempt a second.
    TenantDomain::query()->create([
        'tenant_id' => $owner->tenant_id,
        'domain' => 'first-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $response = $this->postJson('/api/v1/admin/domains', [
        'domain' => 'second-' . bin2hex(random_bytes(3)) . '.uz',
    ]);

    // The exact status is 403 or 422 depending on how Agent C3 surfaces it.
    expect($response->status())->toBeIn([403, 409, 422]);
});

it('POST /admin/domains/{id}/verify triggers a DNS check', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.domains.verify')) {
        $this->markTestSkipped('Verify endpoint not yet wired (pending C3).');
    }

    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $row = TenantDomain::query()->create([
        'tenant_id' => $owner->tenant_id,
        'domain' => 'verify-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $response = $this->postJson('/api/v1/admin/domains/' . $row->id . '/verify');

    // The controller may dispatch a job or run synchronously — either way
    // the call must succeed and surface the current state.
    expect($response->status())->toBeIn([200, 202]);
});

it('POST /admin/domains/{id}/set-primary updates the primary flag and clears the previous one', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.domains.set_primary')) {
        $this->markTestSkipped('Set-primary endpoint not yet wired (pending C3).');
    }

    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'enterprise'])->save(); // multi-domain
    Sanctum::actingAs($owner);

    $first = TenantDomain::query()->create([
        'tenant_id' => $owner->tenant_id,
        'domain' => 'first-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => true,
        'is_verified' => true,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
        'verified_at' => now(),
    ]);

    $second = TenantDomain::query()->create([
        'tenant_id' => $owner->tenant_id,
        'domain' => 'second-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => false,
        'is_verified' => true,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('b', 40),
        'verified_at' => now(),
    ]);

    $this->postJson('/api/v1/admin/domains/' . $second->id . '/set-primary')->assertOk();

    expect($second->fresh()->is_primary)->toBeTrue();
    expect($first->fresh()->is_primary)->toBeFalse();
});

it('DELETE /admin/domains/{id} soft-deletes the row', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $row = TenantDomain::query()->create([
        'tenant_id' => $owner->tenant_id,
        'domain' => 'kill-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $this->deleteJson('/api/v1/admin/domains/' . $row->id)->assertNoContent();

    expect(TenantDomain::find($row->id))->toBeNull();
    expect(TenantDomain::withTrashed()->find($row->id)->deleted_at)->not->toBeNull();
});

it('cross-tenant lookup returns 404 (no enumeration leak)', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    $stranger = Tenant::factory()->create();
    $strangerRow = TenantDomain::query()->create([
        'tenant_id' => $stranger->id,
        'domain' => 'stranger-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('z', 40),
    ]);

    // Verify endpoint exposes a writable lookup — must 404 across tenants
    // rather than 403/200 to prevent id enumeration via status differences.
    $this->postJson('/api/v1/admin/domains/' . $strangerRow->id . '/verify')
        ->assertStatus(404);
});

it('unauthenticated requests return 401', function (): void {
    $this->getJson('/api/v1/admin/domains')->assertStatus(401);
});

it('cashier role cannot create domains (403)', function (): void {
    Role::findOrCreate('cashier', 'web');
    $tenant = Tenant::factory()->create(['tier' => 'plus']);
    $cashier = \App\Models\User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $cashier->assignRole('cashier');

    Sanctum::actingAs($cashier);

    $this->postJson('/api/v1/admin/domains', [
        'domain' => 'cashier-' . bin2hex(random_bytes(3)) . '.uz',
    ])->assertStatus(403);
});
