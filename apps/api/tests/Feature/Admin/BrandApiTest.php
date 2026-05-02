<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — Tenant Brand admin API
|--------------------------------------------------------------------------
|
| Spec covered (Agent C3 — `/api/v1/admin/brand`):
|   GET  /admin/brand           — return current tenant brand (auto-create
|                                  defaults if missing).
|   PATCH /admin/brand          — partial update with hex-color & theme-enum
|                                  validation.
|   POST  /admin/brand/logo     — upload to MinIO, returns public URL.
|
| Authorisation:
|   - Owner / Manager => may read & update.
|   - Cashier / Waiter / Chef => 403 on writes.
|   - Cross-tenant => 404 (the model is keyed by tenant_id, an attempt to
|     reach another tenant's brand never matches).
|
| Tier-gating:
|   - `custom_css` field rejected for Free + Pro tenants (HTTP 403/422).
|   - Open for Plus + Enterprise.
|
| All these tests are gated behind `Route::has(...)` so they auto-skip
| while Agent C3 is still wiring the endpoints. As soon as the routes
| land the assertions activate.
*/

use App\Domain\Tenant\Models\TenantBrand;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');
    Role::findOrCreate('manager', 'web');
    Role::findOrCreate('cashier', 'web');

    if (! \Illuminate\Support\Facades\Route::has('v1.admin.brand.show')
        && ! \Illuminate\Support\Facades\Route::has('v1.admin.brand.update')) {
        $this->markTestSkipped('Brand admin endpoints not yet wired (pending Agent C3).');
    }
});

it('GET /api/v1/admin/brand returns the current tenant brand', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    TenantBrand::query()->create([
        'tenant_id' => $owner->tenant_id,
        'theme' => 'modern',
        'primary_color' => '#FF0000',
        'accent_color' => '#00FF00',
        'text_color' => '#000000',
        'background_color' => '#FFFFFF',
        'font_family' => 'Inter',
    ]);

    $this->getJson('/api/v1/admin/brand')
        ->assertOk()
        ->assertJsonPath('data.primary_color', '#FF0000')
        ->assertJsonPath('data.theme', 'modern');
});

it('GET /api/v1/admin/brand auto-creates a default brand if none exists', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    expect(TenantBrand::query()->where('tenant_id', $owner->tenant_id)->exists())->toBeFalse();

    $this->getJson('/api/v1/admin/brand')->assertOk();

    expect(TenantBrand::query()->where('tenant_id', $owner->tenant_id)->exists())->toBeTrue();
});

it('PATCH /api/v1/admin/brand updates the brand fields', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    TenantBrand::query()->create([
        'tenant_id' => $owner->tenant_id,
        'theme' => 'modern',
        'primary_color' => '#EA7C69',
        'accent_color' => '#9333EA',
        'text_color' => '#0F172A',
        'background_color' => '#FFFFFF',
        'font_family' => 'Inter',
    ]);

    $this->patchJson('/api/v1/admin/brand', [
        'primary_color' => '#123456',
        'theme' => 'classic',
    ])
        ->assertOk()
        ->assertJsonPath('data.primary_color', '#123456')
        ->assertJsonPath('data.theme', 'classic');
});

it('PATCH validates color hex format', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->patchJson('/api/v1/admin/brand', [
        'primary_color' => 'not-a-color',
    ])->assertStatus(422)->assertJsonValidationErrors(['primary_color']);
});

it('PATCH validates color hex must be 7-char form', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->patchJson('/api/v1/admin/brand', [
        'primary_color' => '#ABC', // 3-char shorthand should be rejected
    ])->assertStatus(422)->assertJsonValidationErrors(['primary_color']);
});

it('PATCH validates theme enum (modern/classic/minimal/premium)', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->patchJson('/api/v1/admin/brand', [
        'theme' => 'galactic',
    ])->assertStatus(422)->assertJsonValidationErrors(['theme']);
});

it('rejects custom_css update for free-tier tenants', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'free'])->save();
    Sanctum::actingAs($owner);

    $response = $this->patchJson('/api/v1/admin/brand', [
        'custom_css' => '.foo { color: red; }',
    ]);

    expect($response->status())->toBeIn([403, 422]);
});

it('rejects custom_css update for pro-tier tenants', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'pro'])->save();
    Sanctum::actingAs($owner);

    $response = $this->patchJson('/api/v1/admin/brand', [
        'custom_css' => '.foo { color: red; }',
    ]);

    expect($response->status())->toBeIn([403, 422]);
});

it('allows custom_css update for plus-tier tenants', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    Sanctum::actingAs($owner);

    TenantBrand::query()->create([
        'tenant_id' => $owner->tenant_id,
        'theme' => 'modern',
        'primary_color' => '#EA7C69',
        'accent_color' => '#9333EA',
        'text_color' => '#0F172A',
        'background_color' => '#FFFFFF',
        'font_family' => 'Inter',
    ]);

    $this->patchJson('/api/v1/admin/brand', [
        'custom_css' => '.brand { color: red; }',
    ])->assertOk();
});

it('allows custom_css update for enterprise-tier tenants', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'enterprise'])->save();
    Sanctum::actingAs($owner);

    TenantBrand::query()->create([
        'tenant_id' => $owner->tenant_id,
        'theme' => 'premium',
        'primary_color' => '#000000',
        'accent_color' => '#FFFFFF',
        'text_color' => '#0F172A',
        'background_color' => '#FFFFFF',
        'font_family' => 'Inter',
    ]);

    $this->patchJson('/api/v1/admin/brand', [
        'custom_css' => 'body { background: black; }',
    ])->assertOk();
});

it('manager role can update brand', function (): void {
    Role::findOrCreate('manager', 'web');
    $tenant = \App\Domain\Tenant\Models\Tenant::factory()->create();
    $manager = \App\Models\User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $manager->assignRole('manager');

    Sanctum::actingAs($manager);

    $this->patchJson('/api/v1/admin/brand', [
        'primary_color' => '#222222',
    ])->assertSuccessful();
});

it('cashier role cannot update brand (403)', function (): void {
    Role::findOrCreate('cashier', 'web');
    $tenant = \App\Domain\Tenant\Models\Tenant::factory()->create();
    $cashier = \App\Models\User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $cashier->assignRole('cashier');

    Sanctum::actingAs($cashier);

    $this->patchJson('/api/v1/admin/brand', [
        'primary_color' => '#222222',
    ])->assertStatus(403);
});

it('unauthenticated PATCH returns 401', function (): void {
    $this->patchJson('/api/v1/admin/brand', [
        'primary_color' => '#222222',
    ])->assertStatus(401);
});

it('rejects unknown / unfillable fields silently (no 500)', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    // `tenant_id` should be ignored / 422 — never let a client point to a
    // different tenant's brand row by smuggling an id.
    $response = $this->patchJson('/api/v1/admin/brand', [
        'tenant_id' => 'fake-uuid-zero',
        'primary_color' => '#aabbcc',
    ]);

    expect($response->status())->toBeIn([200, 422]);
});

it('logo upload returns a public MinIO URL', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.brand.logo.upload')) {
        $this->markTestSkipped('Logo upload endpoint not yet wired (pending C3).');
    }

    \Illuminate\Support\Facades\Storage::fake('public');
    \Illuminate\Support\Facades\Storage::fake('s3');

    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $file = \Illuminate\Http\Testing\File::image('logo.png', 200, 200);

    $response = $this->postJson('/api/v1/admin/brand/logo', [
        'logo' => $file,
    ])->assertOk();

    $url = $response->json('data.logo_url');
    expect($url)->toBeString();
    expect($url)->not->toBe('');
});

it('logo upload rejects non-image MIME types', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.brand.logo.upload')) {
        $this->markTestSkipped('Logo upload endpoint not yet wired (pending C3).');
    }

    \Illuminate\Support\Facades\Storage::fake('public');
    \Illuminate\Support\Facades\Storage::fake('s3');

    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $file = \Illuminate\Http\Testing\File::create('document.pdf', 100, 'application/pdf');

    $this->postJson('/api/v1/admin/brand/logo', ['logo' => $file])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['logo']);
});

it('logo upload rejects files over 2MB', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.brand.logo.upload')) {
        $this->markTestSkipped('Logo upload endpoint not yet wired (pending C3).');
    }

    \Illuminate\Support\Facades\Storage::fake('public');
    \Illuminate\Support\Facades\Storage::fake('s3');

    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    // 3 MiB image — should be rejected (limit is 2 MB).
    $oversized = \Illuminate\Http\Testing\File::image('big.png', 4000, 4000)->size(3072);

    $this->postJson('/api/v1/admin/brand/logo', ['logo' => $oversized])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['logo']);
});
