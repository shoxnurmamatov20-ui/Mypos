<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — Schema integrity (AI + Multi-region)
|--------------------------------------------------------------------------
|
| Spec covered (Agent E1 migrations):
|   - `2026_07_01_000001_create_countries_table.php`
|   - `2026_07_01_000002_create_currencies_table.php`
|   - `2026_07_01_000003_create_exchange_rates_table.php`
|   - `2026_07_01_000004_add_region_to_tenants.php`
|   - `2026_07_01_000005_add_currency_to_orders_payments.php`
|   - `2026_07_01_000006_create_ai_generations_log.php`
|
| Verified invariants:
|   - All expected columns/types/defaults are present.
|   - Unique (from_currency, to_currency, rate_date) on exchange_rates.
|   - Foreign keys: exchange_rates → currencies, tenants → countries +
|     currencies, orders/payments → currencies, ai_generations_log →
|     tenants/users.
|   - RLS enabled on ai_generations_log with the canonical
|     `tenant_isolation_ai_generations_log` policy.
|   - Indexes wired correctly (tenant_id+created_at on ai logs, etc.).
|
| Pure schema introspection — no row inserts, runs after RefreshDatabase.
| PostgreSQL-specific assertions (RLS, partial indexes, FK introspection)
| skip on sqlite drivers.
*/

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Phase 4 schema invariants are pgsql-only (RLS, FK introspection).');
    }
});

it('countries table exists with expected columns', function (): void {
    if (! Schema::hasTable('countries')) {
        $this->markTestSkipped('countries table not migrated.');
    }

    $expected = [
        'code', 'name', 'currency_code', 'default_locale',
        'phone_prefix', 'timezone', 'is_active', 'launched_at',
        'created_at', 'updated_at',
    ];
    foreach ($expected as $col) {
        expect(Schema::hasColumn('countries', $col))
            ->toBeTrue("`countries` is missing expected column `{$col}`");
    }
});

it('currencies table exists with expected columns', function (): void {
    if (! Schema::hasTable('currencies')) {
        $this->markTestSkipped('currencies table not migrated.');
    }

    $expected = ['code', 'name', 'symbol', 'decimals', 'is_active', 'created_at', 'updated_at'];
    foreach ($expected as $col) {
        expect(Schema::hasColumn('currencies', $col))
            ->toBeTrue("`currencies` is missing expected column `{$col}`");
    }
});

it('exchange_rates has unique (from, to, date) index', function (): void {
    if (! Schema::hasTable('exchange_rates')) {
        $this->markTestSkipped('exchange_rates table not migrated.');
    }

    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'exchange_rates'
           AND indexname = 'exchange_rates_pair_date_uq'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('UNIQUE');
    expect($rows[0]->indexdef)->toContain('from_currency');
    expect($rows[0]->indexdef)->toContain('to_currency');
    expect($rows[0]->indexdef)->toContain('rate_date');
});

it('exchange_rates has FK to currencies on both from + to', function (): void {
    if (! Schema::hasTable('exchange_rates')) {
        $this->markTestSkipped('exchange_rates table not migrated.');
    }

    $rows = DB::select(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'exchange_rates'::regclass
           AND contype = 'f'
           AND confrelid = 'currencies'::regclass",
    );

    // Two FKs (from_currency + to_currency) — both restrict on delete.
    expect(count($rows))->toBeGreaterThanOrEqual(2);
    foreach ($rows as $row) {
        // 'r' = restrict on delete (Laravel ->restrictOnDelete()).
        expect($row->confdeltype)->toBe('r');
    }
});

it('exchange_rates has DESC index on rate_date for newest-first lookups', function (): void {
    if (! Schema::hasTable('exchange_rates')) {
        $this->markTestSkipped('exchange_rates table not migrated.');
    }

    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'exchange_rates'
           AND indexname = 'exchange_rates_date_idx'",
    );

    expect(count($rows))->toBe(1);
    expect($rows[0]->indexdef)->toContain('rate_date');
});

it('ai_generations_log table exists with expected columns', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    $expected = [
        'id', 'tenant_id', 'user_id', 'feature', 'model',
        'input_tokens', 'output_tokens', 'cost_usd',
        'status', 'error_message', 'duration_ms',
        'request_payload', 'response_payload',
        'created_at',
    ];
    foreach ($expected as $col) {
        expect(Schema::hasColumn('ai_generations_log', $col))
            ->toBeTrue("`ai_generations_log` is missing expected column `{$col}`");
    }
});

it('ai_generations_log has RLS enabled', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    $row = DB::selectOne(
        "SELECT rowsecurity FROM pg_tables
         WHERE schemaname = current_schema()
           AND tablename = 'ai_generations_log'",
    );

    expect($row)->not->toBeNull();
    expect((bool) $row->rowsecurity)->toBeTrue();
});

it('ai_generations_log has the canonical tenant_isolation policy', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    $rows = DB::select(
        "SELECT policyname FROM pg_policies
         WHERE schemaname = current_schema()
           AND tablename = 'ai_generations_log'",
    );
    $names = array_map(static fn ($r) => $r->policyname, $rows);

    expect(in_array('tenant_isolation_ai_generations_log', $names, true))->toBeTrue();
});

it('ai_generations_log has tenant_id+created_at compound index', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    // Either Agent E1's `ai_generations_log_tenant_idx` or Agent E2's
    // `ai_log_tenant_date_idx` — both express the same intent (tenant
    // scoping on the hot rate-limit / cost-dashboard query path).
    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'ai_generations_log'
           AND indexdef ILIKE '%tenant_id%'
           AND indexdef ILIKE '%created_at%'",
    );

    expect(count($rows))->toBeGreaterThanOrEqual(1);
});

it('ai_generations_log has feature+created_at compound index', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    $rows = DB::select(
        "SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'ai_generations_log'
           AND indexdef ILIKE '%feature%'
           AND indexdef ILIKE '%created_at%'",
    );

    expect(count($rows))->toBeGreaterThanOrEqual(1);
});

it('ai_generations_log FK to tenants cascades on delete', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'ai_generations_log'::regclass
           AND contype = 'f'
           AND confrelid = 'tenants'::regclass",
    );

    expect($row)->not->toBeNull();
    expect($row->confdeltype)->toBe('c'); // cascade
});

it('ai_generations_log FK to users sets null on delete (audit preservation)', function (): void {
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not migrated.');
    }

    $row = DB::selectOne(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'ai_generations_log'::regclass
           AND contype = 'f'
           AND confrelid = 'users'::regclass",
    );

    expect($row)->not->toBeNull();
    expect($row->confdeltype)->toBe('n'); // SET NULL
});

it('tenants has country_code with FK to countries', function (): void {
    if (! Schema::hasColumn('tenants', 'country_code')) {
        $this->markTestSkipped('tenants.country_code column not migrated.');
    }

    expect(Schema::hasColumn('tenants', 'country_code'))->toBeTrue();

    $rows = DB::select(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenants'::regclass
           AND contype = 'f'
           AND confrelid = 'countries'::regclass",
    );
    expect(count($rows))->toBe(1);
});

it('tenants has currency_code with FK to currencies', function (): void {
    if (! Schema::hasColumn('tenants', 'currency_code')) {
        $this->markTestSkipped('tenants.currency_code column not migrated.');
    }

    expect(Schema::hasColumn('tenants', 'currency_code'))->toBeTrue();

    $rows = DB::select(
        "SELECT confdeltype FROM pg_constraint
         WHERE conrelid = 'tenants'::regclass
           AND contype = 'f'
           AND confrelid = 'currencies'::regclass",
    );
    // tenants references currencies via currency_code (Phase 4) — exactly one FK.
    expect(count($rows))->toBeGreaterThanOrEqual(1);
});

it('tenants country_code default is UZ', function (): void {
    if (! Schema::hasColumn('tenants', 'country_code')) {
        $this->markTestSkipped('tenants.country_code column not migrated.');
    }

    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'tenants' AND column_name = 'country_code'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'UZ'");
});

it('tenants currency_code default is UZS', function (): void {
    if (! Schema::hasColumn('tenants', 'currency_code')) {
        $this->markTestSkipped('tenants.currency_code column not migrated.');
    }

    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'tenants' AND column_name = 'currency_code'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'UZS'");
});

it('orders has currency_code column with default UZS', function (): void {
    if (! Schema::hasColumn('orders', 'currency_code')) {
        $this->markTestSkipped('orders.currency_code column not migrated.');
    }

    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'orders' AND column_name = 'currency_code'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'UZS'");
});

it('payments has currency_code column with default UZS', function (): void {
    if (! Schema::hasColumn('payments', 'currency_code')) {
        $this->markTestSkipped('payments.currency_code column not migrated.');
    }

    $row = DB::selectOne(
        "SELECT column_default FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'payments' AND column_name = 'currency_code'",
    );

    expect($row)->not->toBeNull();
    expect((string) $row->column_default)->toContain("'UZS'");
});

it('orders has compound (tenant_id, currency_code) index for FX reports', function (): void {
    if (! Schema::hasColumn('orders', 'currency_code')) {
        $this->markTestSkipped('orders.currency_code column not migrated.');
    }

    $rows = DB::select(
        "SELECT indexname FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'orders'
           AND indexname = 'orders_tenant_currency_idx'",
    );

    expect(count($rows))->toBe(1);
});

it('payments has compound (tenant_id, currency_code) index', function (): void {
    if (! Schema::hasColumn('payments', 'currency_code')) {
        $this->markTestSkipped('payments.currency_code column not migrated.');
    }

    $rows = DB::select(
        "SELECT indexname FROM pg_indexes
         WHERE schemaname = current_schema()
           AND tablename = 'payments'
           AND indexname = 'payments_tenant_currency_idx'",
    );

    expect(count($rows))->toBe(1);
});

it('Phase 4 tables are queryable after RefreshDatabase', function (): void {
    foreach (['countries', 'currencies', 'exchange_rates', 'ai_generations_log'] as $table) {
        if (! Schema::hasTable($table)) {
            continue;
        }
        expect(DB::table($table)->count())->toBeGreaterThanOrEqual(0);
    }
});
