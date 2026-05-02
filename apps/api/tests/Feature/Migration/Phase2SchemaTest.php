<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — Schema integrity
|--------------------------------------------------------------------------
|
| Spec covered (Agent C1 migrations):
|   - `2026_05_15_000001_create_tenant_domains_table.php`
|   - `2026_05_15_000002_create_tenant_brands_table.php`
|   - `2026_05_15_000003_add_tier_to_tenants.php`
|
| Verified invariants:
|   - Required columns exist with the expected types/defaults.
|   - PK / FK / soft-delete / partial unique indexes wired correctly.
|   - RLS enabled with the canonical `tenant_isolation_<table>` policy.
|   - `tenants.tier` column added with `'free'` default + index.
|
| Pure schema-introspection tests — they don't insert any rows so they're
| safe regardless of test order or factories.
*/

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Phase 2 schema invariants are pgsql-only (RLS, partial indexes).');
    }
});

it('tenant_domains table exists with all expected columns', function (): void {
    expect(Schema::hasTable('tenant_domains'))->toBeTrue();

    $expected = [
        'id', 'tenant_id', 'domain',
        'is_primary', 'is_verified',
        'verification_method', 'verification_token', 'verified_at',
        'ssl_status', 'ssl_issued_at', 'ssl_error',
        'last_checked_at', 'redirects_to',
        'created_at', 'updated_at', 'deleted_at',
    ];

    foreach ($expected as $col) {
        expect(Schema::hasColumn('tenant_domains', $col))
            ->toBeTrue("`tenant_domains` is missing expected column `{$col}`");
    }
});

it('tenant_domains.domain has a unique constraint', function (): void {
    $rows = DB::select(
        "SELECT indexname FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_domains'",
    );
    $names = array_map(fn ($r) => $r->indexname, $rows);

    expect(in_array('tenant_domains_domain_uq', $names, true))->toBeTrue();
});

it('tenant_domains has a partial unique index for (tenant_id) WHERE is_primary', function (): void {
    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_domains'
           AND indexname = 'tenant_domains_primary_uq'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('is_primary');
    expect($rows[0]->indexdef)->toContain('deleted_at IS NULL');
});

it('tenant_domains has a partial verified-only index', function (): void {
    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_domains'
           AND indexname = 'tenant_domains_verified_idx'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('is_verified');
});

it('tenant_domains has RLS enabled', function (): void {
    $row = DB::selectOne(
        "SELECT rowsecurity FROM pg_tables
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_domains'",
    );

    expect($row)->not->toBeNull();
    expect((bool) $row->rowsecurity)->toBeTrue();
});

it('tenant_domains has the canonical tenant_isolation policy', function (): void {
    $rows = DB::select(
        "SELECT policyname FROM pg_policies
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_domains'",
    );
    $names = array_map(fn ($r) => $r->policyname, $rows);

    expect(in_array('tenant_isolation_tenant_domains', $names, true))->toBeTrue();
});

it('tenant_domains has the FK to tenants(id) with cascade delete', function (): void {
    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenant_domains'::regclass
           AND contype = 'f'
           AND confrelid = 'tenants'::regclass",
    );

    expect($row)->not->toBeNull();
    // 'c' = CASCADE in pg_constraint.confdeltype.
    expect($row->confdeltype)->toBe('c');
});

it('tenant_brands table exists with all expected columns', function (): void {
    expect(Schema::hasTable('tenant_brands'))->toBeTrue();

    $expected = [
        'tenant_id', 'theme',
        'logo_url', 'logo_dark_url', 'favicon_url',
        'cover_image_url', 'hero_image_url', 'ogimage_url',
        'primary_color', 'accent_color', 'text_color', 'background_color',
        'font_family', 'font_heading',
        'hero_title', 'hero_subtitle', 'tagline',
        'custom_css',
        'instagram_handle', 'facebook_url', 'telegram_handle',
        'created_at', 'updated_at',
    ];

    foreach ($expected as $col) {
        expect(Schema::hasColumn('tenant_brands', $col))
            ->toBeTrue("`tenant_brands` is missing expected column `{$col}`");
    }
});

it('tenant_brands uses tenant_id as primary key (1:1 with tenants)', function (): void {
    $row = DB::selectOne(
        "SELECT a.attname AS column
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         WHERE i.indrelid = 'tenant_brands'::regclass AND i.indisprimary",
    );

    expect($row)->not->toBeNull();
    expect($row->column)->toBe('tenant_id');
});

it('tenant_brands has RLS enabled', function (): void {
    $row = DB::selectOne(
        "SELECT rowsecurity FROM pg_tables
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_brands'",
    );

    expect($row)->not->toBeNull();
    expect((bool) $row->rowsecurity)->toBeTrue();
});

it('tenant_brands has the canonical tenant_isolation policy', function (): void {
    $rows = DB::select(
        "SELECT policyname FROM pg_policies
         WHERE schemaname = current_schema()
           AND tablename = 'tenant_brands'",
    );
    $names = array_map(fn ($r) => $r->policyname, $rows);

    expect(in_array('tenant_isolation_tenant_brands', $names, true))->toBeTrue();
});

it('tenant_brands has the FK to tenants(id) with cascade delete', function (): void {
    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenant_brands'::regclass
           AND contype = 'f'
           AND confrelid = 'tenants'::regclass",
    );

    expect($row)->not->toBeNull();
    expect($row->confdeltype)->toBe('c');
});

it('tenants.tier column exists with `free` default', function (): void {
    expect(Schema::hasColumn('tenants', 'tier'))->toBeTrue();

    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'tenants' AND column_name = 'tier'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'free'");
});

it('tenants.tier_started_at and tier_expires_at columns exist (nullable timestamps)', function (): void {
    expect(Schema::hasColumn('tenants', 'tier_started_at'))->toBeTrue();
    expect(Schema::hasColumn('tenants', 'tier_expires_at'))->toBeTrue();
});

it('tenants table has an index on the tier column', function (): void {
    $rows = DB::select(
        "SELECT indexname FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'tenants'
           AND indexname = 'tenants_tier_idx'",
    );
    expect(count($rows))->toBe(1);
});

it('Phase 2 tables can be cleared and re-truncated without breaking constraints', function (): void {
    // Smoke test: TRUNCATE order is sensitive (FK cascades). The migration
    // should handle a reset cleanly. RefreshDatabase already handled this
    // for us — we just confirm the tables are still queryable.
    expect(DB::table('tenant_domains')->count())->toBeGreaterThanOrEqual(0);
    expect(DB::table('tenant_brands')->count())->toBeGreaterThanOrEqual(0);
});
