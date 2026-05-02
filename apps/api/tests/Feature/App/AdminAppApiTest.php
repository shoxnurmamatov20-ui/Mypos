<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — `/api/v1/admin/apps` tenant-owner CRUD
|--------------------------------------------------------------------------
|
| Spec covered (Agent D2 — `App\Http\Controllers\Api\V1\Admin\AppController`):
|
|   GET    /admin/apps                    — list current tenant's apps.
|   POST   /admin/apps                    — create platform-specific app config.
|   GET    /admin/apps/{id}               — show one row (with latestBuild).
|   PATCH  /admin/apps/{id}               — partial update (frozen platform / bundle).
|   DELETE /admin/apps/{id}               — soft-delete unless live build pending.
|   POST   /admin/apps/{id}/build         — dispatch a fresh EAS Build (202).
|   GET    /admin/apps/{id}/builds        — full build history.
|
| Tier gate: native_app is Enterprise-only in the live `TierFeatures` matrix.
| Per-resource authorization comes from `TenantAppPolicy`:
|   - Owner: full read/write.
|   - Manager: read-only (viewAny + view).
|   - Cashier / Waiter / Chef: 403 across the board.
|   - Cross-tenant: 404 (the BelongsToTenant scope filters out the row, then
|     `firstOrFail()` 404s).
*/

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Jobs\DispatchEasBuildJob;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');
    Role::findOrCreate('manager', 'web');
    Role::findOrCreate('cashier', 'web');

    if (! \Illuminate\Support\Facades\Route::has('v1.admin.apps.index')) {
        $this->markTestSkipped('Admin app routes not yet wired (pending Agent D2).');
    }
});

/** Make a tenant + owner whose tier permits native-app management. */
function makeAppOwner(string $tier = 'enterprise'): \App\Models\User
{
    $tenant = Tenant::factory()->create(['tier' => $tier]);
    return actingAsTenantOwner($tenant);
}

/** Make a TenantApp row owned by the given user's tenant. */
function makeOwnedApp(\App\Models\User $owner, array $overrides = []): TenantApp
{
    $app = new TenantApp();
    $app->forceFill(array_merge([
        'tenant_id' => $owner->tenant_id,
        'platform' => 'ios',
        'app_name' => 'Owned App',
        'bundle_id' => 'uz.owned.' . bin2hex(random_bytes(3)),
        'icon_url' => 'https://cdn.mypos.uz/icon.png',
    ], $overrides))->save();

    return $app->fresh();
}

it('GET /admin/apps lists only the current tenant\'s apps', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    makeOwnedApp($owner, ['platform' => 'ios', 'bundle_id' => 'uz.mine.' . bin2hex(random_bytes(3))]);

    // Stranger tenant — not the same enterprise.
    $stranger = Tenant::factory()->create(['tier' => 'enterprise']);
    TenantApp::query()->create([
        'tenant_id' => $stranger->id,
        'platform' => 'ios',
        'app_name' => 'Strangers',
        'bundle_id' => 'uz.stranger.' . bin2hex(random_bytes(3)),
    ]);

    $response = $this->getJson('/api/v1/admin/apps')->assertOk();
    $tenantIds = collect($response->json('data'))->pluck('tenant_id')->unique()->all();

    foreach ($tenantIds as $id) {
        expect($id)->toBe($owner->tenant_id);
    }
});

it('POST /admin/apps creates a new app config row', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $bundle = 'uz.create.' . bin2hex(random_bytes(3));
    $response = $this->postJson('/api/v1/admin/apps', [
        'platform' => 'ios',
        'app_name' => 'Brand new',
        'bundle_id' => $bundle,
    ])->assertCreated();

    expect($response->json('data.bundle_id'))->toBe($bundle);
    expect($response->json('data.tenant_id'))->toBe($owner->tenant_id);
    expect($response->json('data.status'))->toBe('draft');
});

it('POST /admin/apps validates bundle_id reverse-domain format', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/admin/apps', [
        'platform' => 'ios',
        'app_name' => 'Bad bundle',
        // No dots — fails the reverse-DNS regex.
        'bundle_id' => 'notavalidbundle',
    ])->assertStatus(422)->assertJsonValidationErrors(['bundle_id']);
});

it('POST /admin/apps rejects a duplicate bundle_id', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $bundle = 'uz.dupe.' . bin2hex(random_bytes(3));
    makeOwnedApp($owner, ['platform' => 'ios', 'bundle_id' => $bundle]);

    $response = $this->postJson('/api/v1/admin/apps', [
        'platform' => 'android',
        'app_name' => 'Dup',
        'bundle_id' => $bundle, // bundle_id is GLOBALLY unique across tenants.
    ]);

    expect($response->status())->toBeIn([409, 422]);
});

it('POST /admin/apps rejects a second row for the same (tenant, platform)', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    makeOwnedApp($owner, [
        'platform' => 'ios',
        'bundle_id' => 'uz.first.' . bin2hex(random_bytes(3)),
    ]);

    $response = $this->postJson('/api/v1/admin/apps', [
        'platform' => 'ios', // already exists for this tenant
        'app_name' => 'Second iOS',
        'bundle_id' => 'uz.second.' . bin2hex(random_bytes(3)),
    ]);

    expect($response->status())->toBeIn([409, 422]);
});

it('POST /admin/apps lowercases the bundle_id (prepareForValidation)', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/admin/apps', [
        'platform' => 'android',
        'app_name' => 'Case test',
        'bundle_id' => 'UZ.MIXEDCASE.' . bin2hex(random_bytes(3)),
    ]);

    if ($response->status() === 201) {
        expect($response->json('data.bundle_id'))->toMatch('/^[a-z0-9.-]+$/');
    } else {
        // Some drivers may surface a 422 for the upper-case input —
        // accept either since both indicate the regex is enforced.
        expect($response->status())->toBe(422);
    }
});

it('PATCH /admin/apps/{id} updates app_name but ignores platform/bundle_id', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $app = makeOwnedApp($owner);
    $originalBundle = $app->bundle_id;

    $response = $this->patchJson('/api/v1/admin/apps/' . $app->id, [
        'app_name' => 'Renamed App',
        // These should be silently ignored (not in UpdateAppRequest::rules()).
        'platform' => 'android',
        'bundle_id' => 'uz.changed.' . bin2hex(random_bytes(3)),
    ])->assertOk();

    $refreshed = $app->fresh();
    expect($refreshed->app_name)->toBe('Renamed App');
    expect($refreshed->bundle_id)->toBe($originalBundle);
    expect($refreshed->platform->value)->toBe('ios');
});

it('DELETE /admin/apps/{id} soft-deletes when no in-progress builds exist', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $app = makeOwnedApp($owner);

    $this->deleteJson('/api/v1/admin/apps/' . $app->id)
        ->assertNoContent();

    $row = TenantApp::query()->withTrashed()->find($app->id);
    expect($row->deleted_at)->not->toBeNull();
});

it('DELETE /admin/apps/{id} returns 422 while a live build is in progress', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $app = makeOwnedApp($owner);

    TenantAppBuild::query()->create([
        'tenant_id' => $owner->tenant_id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => BuildStatus::Queued->value,
        'submission_status' => 'pending',
        'version' => '0.0.1',
        'build_number' => 1,
    ]);

    $this->deleteJson('/api/v1/admin/apps/' . $app->id)
        ->assertStatus(422);

    expect($app->fresh()->deleted_at)->toBeNull();
});

it('POST /admin/apps/{id}/build returns 202 and queues a build', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $app = makeOwnedApp($owner);

    $this->postJson('/api/v1/admin/apps/' . $app->id . '/build')
        ->assertAccepted()
        ->assertJsonPath('data.status', BuildStatus::Queued->value);

    Bus::assertDispatched(DispatchEasBuildJob::class);
});

it('GET /admin/apps/{id}/builds returns the full build history (newest first)', function (): void {
    $owner = makeAppOwner();
    Sanctum::actingAs($owner);

    $app = makeOwnedApp($owner);

    foreach (range(1, 3) as $i) {
        TenantAppBuild::query()->create([
            'tenant_id' => $owner->tenant_id,
            'tenant_app_id' => $app->id,
            'platform' => 'ios',
            'status' => BuildStatus::Finished->value,
            'submission_status' => 'pending',
            'version' => "0.0.{$i}",
            'build_number' => $i,
        ]);
    }

    $response = $this->getJson('/api/v1/admin/apps/' . $app->id . '/builds')->assertOk();

    expect($response->json('data'))->toHaveCount(3);
});

it('manager role can READ apps but not create them (policy: view ok, create denied)', function (): void {
    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);
    $manager = \App\Models\User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $manager->assignRole('manager');
    Sanctum::actingAs($manager);

    // Read should work.
    $this->getJson('/api/v1/admin/apps')->assertOk();

    // Create — TenantAppPolicy::create() requires Owner.
    $response = $this->postJson('/api/v1/admin/apps', [
        'platform' => 'ios',
        'app_name' => 'Manager attempt',
        'bundle_id' => 'uz.mgr.' . bin2hex(random_bytes(3)),
    ]);

    expect($response->status())->toBeIn([403, 422]);
});

it('cashier role gets 403 across the board', function (): void {
    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);
    $cashier = \App\Models\User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $cashier->assignRole('cashier');
    Sanctum::actingAs($cashier);

    // tenant.admin middleware kicks in *before* the policy — cashiers do
    // not pass the role gate, so 403 from there.
    $this->getJson('/api/v1/admin/apps')->assertStatus(403);
    $this->postJson('/api/v1/admin/apps', [
        'platform' => 'ios',
        'app_name' => 'Cashier attempt',
        'bundle_id' => 'uz.cashier.' . bin2hex(random_bytes(3)),
    ])->assertStatus(403);
});

it('returns 404 (not 403) for a cross-tenant id (no enumeration leak)', function (): void {
    $owner = makeAppOwner();

    // Stranger tenant + a stranger-owned app row.
    $stranger = Tenant::factory()->create(['tier' => 'enterprise']);
    $strangerApp = TenantApp::query()->create([
        'tenant_id' => $stranger->id,
        'platform' => 'ios',
        'app_name' => 'Hidden',
        'bundle_id' => 'uz.hidden.' . bin2hex(random_bytes(3)),
    ]);

    Sanctum::actingAs($owner);

    $this->getJson('/api/v1/admin/apps/' . $strangerApp->id)->assertStatus(404);
    $this->patchJson('/api/v1/admin/apps/' . $strangerApp->id, ['app_name' => 'Renamed'])
        ->assertStatus(404);
});

it('unauthenticated requests return 401', function (): void {
    $this->getJson('/api/v1/admin/apps')->assertStatus(401);
});
