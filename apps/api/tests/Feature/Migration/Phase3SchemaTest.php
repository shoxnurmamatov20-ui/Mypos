<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — Schema integrity (Native App Builder)
|--------------------------------------------------------------------------
|
| Spec covered (Agent D1 migrations):
|   - `2026_06_01_000001_create_tenant_apps_table.php`
|   - `2026_06_01_000002_create_tenant_app_builds_table.php`
|   - `2026_06_01_000003_add_native_app_to_tenant_brands.php`
|
| Verified invariants:
|   - All expected columns/types/defaults are present.
|   - Globally unique partial index on `tenant_apps.bundle_id` (active rows).
|   - Per (tenant, platform) partial unique index, also active-only.
|   - Partial index on `tenant_app_builds.eas_build_id` (only set rows).
|   - Foreign keys cascade-delete from tenants.
|   - RLS enabled with the canonical `tenant_isolation_<table>` policies.
|   - `tenant_brands` gained the native_app_* preview columns.
|
| Pure schema-introspection tests — they don't insert any rows so they're
| safe regardless of test order or factories. PostgreSQL-specific assertions
| (RLS, partial indexes) skip on sqlite-driver runs.
*/

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Phase 3 schema invariants are pgsql-only (RLS, partial indexes).');
    }

    if (! Schema::hasTable('tenant_apps') || ! Schema::hasTable('tenant_app_builds')) {
        $this->markTestSkipped('Phase 3 tables not migrated yet (pending Agent D1).');
    }
});

it('tenant_apps table exists with expected columns', function (): void {
    expect(Schema::hasTable('tenant_apps'))->toBeTrue();

    $expected = [
        'id', 'tenant_id', 'platform',
        'app_name', 'short_name', 'bundle_id',
        'description', 'keywords',
        'icon_url', 'splash_url', 'adaptive_icon_url', 'adaptive_icon_bg',
        'feature_graphic_url', 'screenshots',
        'apple_team_id', 'apple_app_id', 'apple_sku',
        'google_package_name', 'google_app_id',
        'build_account', 'status',
        'current_version', 'current_build_number', 'latest_build_id',
        'submitted_at', 'approved_at',
        'created_at', 'updated_at', 'deleted_at',
    ];

    foreach ($expected as $col) {
        expect(Schema::hasColumn('tenant_apps', $col))
            ->toBeTrue("`tenant_apps` is missing expected column `{$col}`");
    }
});

it('tenant_apps has a globally unique partial index on bundle_id (active rows)', function (): void {
    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_apps'
           AND indexname = 'tenant_apps_bundle_uq'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('bundle_id');
    expect($rows[0]->indexdef)->toContain('deleted_at IS NULL');
});

it('tenant_apps has a unique partial index on (tenant_id, platform)', function (): void {
    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_apps'
           AND indexname = 'tenant_apps_tenant_platform_uq'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('tenant_id');
    expect($rows[0]->indexdef)->toContain('platform');
    expect($rows[0]->indexdef)->toContain('deleted_at IS NULL');
});

it('tenant_apps has RLS enabled', function (): void {
    $row = DB::selectOne(
        "SELECT rowsecurity FROM pg_tables
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_apps'",
    );

    expect($row)->not->toBeNull();
    expect((bool) $row->rowsecurity)->toBeTrue();
});

it('tenant_apps has the canonical tenant_isolation policy', function (): void {
    $rows = DB::select(
        "SELECT policyname FROM pg_policies
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_apps'",
    );
    $names = array_map(fn ($r) => $r->policyname, $rows);

    expect(in_array('tenant_isolation_tenant_apps', $names, true))->toBeTrue();
});

it('tenant_apps has FK to tenants(id) with cascade delete', function (): void {
    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenant_apps'::regclass
           AND contype = 'f'
           AND confrelid = 'tenants'::regclass",
    );

    expect($row)->not->toBeNull();
    expect($row->confdeltype)->toBe('c');
});

it('tenant_apps.build_account defaults to "mypos"', function (): void {
    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'tenant_apps' AND column_name = 'build_account'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'mypos'");
});

it('tenant_apps.status defaults to "draft"', function (): void {
    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'tenant_apps' AND column_name = 'status'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'draft'");
});

it('tenant_app_builds table exists with expected columns', function (): void {
    expect(Schema::hasTable('tenant_app_builds'))->toBeTrue();

    $expected = [
        'id', 'tenant_id', 'tenant_app_id', 'platform',
        'eas_build_id', 'eas_project_id', 'build_profile',
        'status', 'submission_status',
        'artifact_url', 'log_url', 'qr_code_url',
        'version', 'build_number',
        'error_message', 'reviewer_notes',
        'started_at', 'finished_at',
        'created_at', 'updated_at',
    ];

    foreach ($expected as $col) {
        expect(Schema::hasColumn('tenant_app_builds', $col))
            ->toBeTrue("`tenant_app_builds` is missing expected column `{$col}`");
    }
});

it('tenant_app_builds has a partial index on eas_build_id (only populated rows)', function (): void {
    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_app_builds'
           AND indexname = 'tenant_app_builds_eas_idx'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('eas_build_id');
    expect($rows[0]->indexdef)->toContain('IS NOT NULL');
});

it('tenant_app_builds has RLS enabled', function (): void {
    $row = DB::selectOne(
        "SELECT rowsecurity FROM pg_tables
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_app_builds'",
    );

    expect($row)->not->toBeNull();
    expect((bool) $row->rowsecurity)->toBeTrue();
});

it('tenant_app_builds has the canonical tenant_isolation policy', function (): void {
    $rows = DB::select(
        "SELECT policyname FROM pg_policies
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_app_builds'",
    );
    $names = array_map(fn ($r) => $r->policyname, $rows);

    expect(in_array('tenant_isolation_tenant_app_builds', $names, true))->toBeTrue();
});

it('tenant_app_builds has FK to tenants(id) with cascade delete', function (): void {
    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenant_app_builds'::regclass
           AND contype = 'f'
           AND confrelid = 'tenants'::regclass",
    );

    expect($row)->not->toBeNull();
    expect($row->confdeltype)->toBe('c');
});

it('tenant_app_builds has FK to tenant_apps(id) with cascade delete', function (): void {
    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenant_app_builds'::regclass
           AND contype = 'f'
           AND confrelid = 'tenant_apps'::regclass",
    );

    expect($row)->not->toBeNull();
    expect($row->confdeltype)->toBe('c');
});

it('tenant_brands gained the native_app_* preview columns', function (): void {
    expect(Schema::hasColumn('tenant_brands', 'native_app_icon_url'))->toBeTrue();
    expect(Schema::hasColumn('tenant_brands', 'native_app_splash_url'))->toBeTrue();
    expect(Schema::hasColumn('tenant_brands', 'native_app_screenshots'))->toBeTrue();
});

it('Phase 3 tables are queryable after RefreshDatabase', function (): void {
    // Smoke test: confirm both tables are reachable post-RefreshDatabase.
    expect(DB::table('tenant_apps')->count())->toBeGreaterThanOrEqual(0);
    expect(DB::table('tenant_app_builds')->count())->toBeGreaterThanOrEqual(0);
});
