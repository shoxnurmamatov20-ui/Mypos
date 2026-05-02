<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — TenantApp model invariants
|--------------------------------------------------------------------------
|
| Spec covered (Agent D1 migration + D2 model):
|   - One row per (tenant, platform). `bundle_id` is globally unique among
|     non-deleted rows so two tenants cannot share an Apple/Google identifier.
|   - At most one row per (tenant_id, platform) among non-deleted rows.
|   - Soft-deleting frees up both the bundle_id and the (tenant, platform)
|     uniqueness slot.
|   - Defaults are sensible: status=draft, build_account=mypos.
|   - `latestBuild()` resolves via the denormalized FK pointer.
|   - FK to tenants cascades on delete.
|
| Notes:
|   - PostgreSQL-specific assertions (partial unique indexes) skip on sqlite.
|   - Tests use `->query()->create([...])` rather than a factory because the
|     TenantAppFactory is owned by Agent D1 and may not exist yet.
*/

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    if (! class_exists(TenantApp::class)) {
        $this->markTestSkipped('TenantApp model not yet shipped (pending Agent D1).');
    }
    // Tests query Models that use BelongsToTenant; without auth context, the
    // global scope fails closed (whereRaw('1=0')). Opt-in to lenient mode
    // since each test sets tenant_id explicitly.
    \App\Domain\Shared\Concerns\BelongsToTenant::allowEmptyTenantContext(true);
});

afterEach(function (): void {
    \App\Domain\Shared\Concerns\BelongsToTenant::allowEmptyTenantContext(false);
});

it('persists with sensible defaults: status=draft, build_account=mypos', function (): void {
    $tenant = Tenant::factory()->create();

    $app = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'My Restaurant',
        'bundle_id' => 'com.mypos.t' . bin2hex(random_bytes(3)),
    ]);

    // status is cast to AppStatus enum; compare via ->value or enum case.
    $statusValue = $app->status instanceof \App\Domain\Tenant\Enums\AppStatus ? $app->status->value : $app->status;
    expect($statusValue)->toBe('draft');
    expect($app->build_account)->toBe('mypos');
});

it('platform is cast to AppPlatform enum', function (): void {
    $tenant = Tenant::factory()->create();

    $app = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'Cast Test',
        'bundle_id' => 'com.mypos.cast' . bin2hex(random_bytes(3)),
    ]);

    expect($app->platform)->toBe(\App\Domain\Tenant\Enums\AppPlatform::Ios);
});

it('bundle_id is unique across all tenants and platforms', function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique indexes are pgsql-only.');
    }

    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();
    $bundle = 'com.mypos.shared' . bin2hex(random_bytes(3));

    TenantApp::query()->create([
        'tenant_id' => $tenantA->id,
        'platform' => 'ios',
        'app_name' => 'First',
        'bundle_id' => $bundle,
    ]);

    expect(fn () => TenantApp::query()->create([
        'tenant_id' => $tenantB->id,
        // Different platform — but bundle_id is *globally* unique, not
        // (bundle_id, platform).
        'platform' => 'android',
        'app_name' => 'Second',
        'bundle_id' => $bundle,
    ]))->toThrow(QueryException::class);
});

it('one app per (tenant, platform) — UQ enforced', function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique indexes are pgsql-only.');
    }

    $tenant = Tenant::factory()->create();

    TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'iOS App',
        'bundle_id' => 'com.mypos.first' . bin2hex(random_bytes(3)),
    ]);

    expect(fn () => TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios', // Same tenant + same platform → blocked.
        'app_name' => 'Duplicate',
        'bundle_id' => 'com.mypos.dup' . bin2hex(random_bytes(3)),
    ]))->toThrow(QueryException::class);
});

it('the same tenant can have separate ios and android rows', function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique indexes are pgsql-only.');
    }

    $tenant = Tenant::factory()->create();

    $ios = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'Plov Club',
        'bundle_id' => 'com.plovclub.ios' . bin2hex(random_bytes(3)),
    ]);

    $android = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'android',
        'app_name' => 'Plov Club',
        'bundle_id' => 'com.plovclub.and' . bin2hex(random_bytes(3)),
    ]);

    expect($ios->id)->not->toBe($android->id);
    expect($ios->platform->value)->toBe('ios');
    expect($android->platform->value)->toBe('android');
});

it('soft-delete frees up the bundle_id for re-use', function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique index excluding deleted_at is pgsql-only.');
    }

    $tenant = Tenant::factory()->create();
    $bundle = 'com.mypos.reuse' . bin2hex(random_bytes(3));

    $first = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'V1',
        'bundle_id' => $bundle,
    ]);

    $first->delete(); // Soft delete -> bundle_uq partial index excludes it.

    $second = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'V2 (rebrand)',
        'bundle_id' => $bundle, // Same bundle id should now be reusable.
    ]);

    expect($second->id)->not->toBe($first->id);
    expect($second->bundle_id)->toBe($bundle);
});

it('belongs to tenant via tenant_id', function (): void {
    $tenant = Tenant::factory()->create();

    $app = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'android',
        'app_name' => 'Rel test',
        'bundle_id' => 'com.mypos.rel' . bin2hex(random_bytes(3)),
    ]);

    expect($app->tenant_id)->toBe($tenant->id);
    expect($app->tenant)->not->toBeNull();
    expect($app->tenant->id)->toBe($tenant->id);
});

it('cascade-deletes when the parent tenant row is hard-deleted', function (): void {
    $tenant = Tenant::factory()->create();

    $app = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'universal',
        'app_name' => 'cascade',
        'bundle_id' => 'com.mypos.cas' . bin2hex(random_bytes(3)),
    ]);

    // Hard-delete to trigger the FK cascade — soft-delete leaves children alive.
    DB::table('tenants')->where('id', $tenant->id)->delete();

    expect(
        TenantApp::query()->withoutGlobalScope('tenant')->withTrashed()->find($app->id),
    )->toBeNull();
});

it('builds() relation returns all builds for the app', function (): void {
    $tenant = Tenant::factory()->create();

    $app = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'Build rel',
        'bundle_id' => 'com.mypos.brel' . bin2hex(random_bytes(3)),
    ]);

    foreach (range(1, 3) as $i) {
        TenantAppBuild::query()->create([
            'tenant_id' => $tenant->id,
            'tenant_app_id' => $app->id,
            'platform' => 'ios',
            'status' => 'queued',
            'submission_status' => 'pending',
            'version' => "0.0.{$i}",
            'build_number' => $i,
        ]);
    }

    $app->refresh();
    expect($app->builds)->toHaveCount(3);
});

it('latestBuild() returns the most recent build via the latest_build_id pointer', function (): void {
    $tenant = Tenant::factory()->create();

    $app = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'Latest test',
        'bundle_id' => 'com.mypos.lat' . bin2hex(random_bytes(3)),
    ]);

    $oldBuild = TenantAppBuild::query()->create([
        'tenant_id' => $tenant->id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => 'finished',
        'submission_status' => 'pending',
        'version' => '0.0.1',
        'build_number' => 1,
    ]);

    $newBuild = TenantAppBuild::query()->create([
        'tenant_id' => $tenant->id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => 'queued',
        'submission_status' => 'pending',
        'version' => '0.0.2',
        'build_number' => 2,
    ]);

    $app->forceFill(['latest_build_id' => $newBuild->id])->save();
    $app->refresh();

    expect($app->latestBuild)->not->toBeNull();
    expect($app->latestBuild->id)->toBe($newBuild->id);
    expect($app->latestBuild->id)->not->toBe($oldBuild->id);
});

it('isBuildable() requires icon_url, bundle_id, and app_name to all be present', function (): void {
    $tenant = Tenant::factory()->create();

    // Missing icon — not buildable yet.
    $partial = TenantApp::query()->create([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'Partial',
        'bundle_id' => 'com.mypos.part' . bin2hex(random_bytes(3)),
    ]);
    expect($partial->isBuildable())->toBeFalse();

    // Filling icon turns it buildable.
    $partial->forceFill(['icon_url' => 'https://cdn.mypos.uz/icon.png'])->save();
    expect($partial->fresh()->isBuildable())->toBeTrue();
});
