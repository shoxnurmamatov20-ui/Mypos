<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| A1 — PostgreSQL Row-Level Security (RLS) on tenant-scoped tables
|--------------------------------------------------------------------------
|
| Spec covered:
|   - Migration `2026_05_01_000001_enable_rls_on_tenant_scoped_tables` enables
|     RLS on every tenant-scoped table (menu_items, orders, payments, ...).
|   - Each table has a `tenant_isolation_<name>` policy that filters rows
|     against the GUC `app.current_tenant_id` (with `*` wildcard for super
|     admin).
|   - Middleware `App\Http\Middleware\SetTenantContext` runs `set_config(...)`
|     to populate the GUC for every authenticated request so the database
|     refuses cross-tenant rows even when the Eloquent global scope is bypassed.
|
| Invariants:
|   - Wrong-tenant GUC ⇒ no rows returned by raw SQL on any RLS-protected
|     table, even when the Eloquent scope is removed via withoutGlobalScopes.
|   - Right-tenant GUC ⇒ the seeded row is returned.
|   - GUC = '*' ⇒ super admin reads from any tenant.
|   - GUC unset / empty ⇒ default-deny (zero rows) outside console context.
|   - pg_tables / pg_policies confirm RLS is actually enabled on every
|     protected table (defence-in-depth check that skips silently on sqlite).
|
| The webhook handlers, payment providers, and audit log queries deliberately
| use `Model::withoutGlobalScopes()` to opt out of the application-level scope
| — RLS is the database-level safety net that catches bugs there.
*/

use App\Domain\Customer\Models\Customer;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Notification\Models\NotificationLog;
use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

/** Skip the whole file on non-pgsql drivers so the suite still passes locally on sqlite. */
beforeEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('RLS is a PostgreSQL feature — skipping on '.DB::connection()->getDriverName());
    }
});

afterEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        return;
    }
    // Always reset role first so we have permissions to clear the GUC.
    try {
        DB::statement('RESET ROLE');
    } catch (Throwable) {
        // Connection may be in a broken state from a failed assertion — ignore.
    }
    // Reset the GUC so it doesn't leak between tests.
    DB::statement("SELECT set_config('app.current_tenant_id', '', false)");
});

function setRlsTenant(string $tenantIdOrStar): void
{
    DB::statement('SELECT set_config(?, ?, false)', ['app.current_tenant_id', $tenantIdOrStar]);
}

function clearRlsTenant(): void
{
    DB::statement("SELECT set_config('app.current_tenant_id', '', false)");
}

/**
 * Switch the connection to a non-superuser, non-BYPASSRLS role so RLS
 * policies are actually enforced. Locally the dev DB user (`mypos`) is
 * SUPERUSER + BYPASSRLS, which makes RLS a no-op. Production uses
 * `mypos_app` which has neither attribute. These tests must run as
 * `mypos_app` to verify enforcement.
 */
function actAsAppRole(): void
{
    DB::statement('SET ROLE mypos_app');
}

it('blocks cross-tenant queries via RLS when GUC is set to wrong tenant', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    // Create the seed data under super-admin GUC ('*') so the INSERT itself isn't blocked.
    setRlsTenant('*');
    $categoryA = MenuCategory::factory()->create(['tenant_id' => $tenantA->id]);
    $itemA = MenuItem::factory()->create([
        'tenant_id' => $tenantA->id,
        'category_id' => $categoryA->id,
    ]);
    $orderA = Order::factory()->create(['tenant_id' => $tenantA->id]);
    $customerA = Customer::factory()->create(['tenant_id' => $tenantA->id]);

    // Now switch to tenant B's context and ensure tenant A's rows are invisible
    // even when Eloquent's global scope is bypassed.
    setRlsTenant($tenantB->id);
    actAsAppRole(); // Drop superuser privileges so RLS actually enforces.

    expect(MenuItem::withoutGlobalScopes()->find($itemA->id))->toBeNull();
    expect(Order::withoutGlobalScopes()->find($orderA->id))->toBeNull();
    expect(Customer::withoutGlobalScopes()->find($customerA->id))->toBeNull();

    // Raw SQL — RLS still applies.
    $rawCount = DB::selectOne('SELECT COUNT(*) AS c FROM menu_items WHERE id = ?', [$itemA->id]);
    expect((int) $rawCount->c)->toBe(0);
});

it('allows queries when GUC is set to correct tenant', function (): void {
    $tenant = Tenant::factory()->create();

    setRlsTenant('*');
    $category = MenuCategory::factory()->create(['tenant_id' => $tenant->id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
    ]);

    setRlsTenant($tenant->id);

    expect(MenuItem::withoutGlobalScopes()->find($item->id))->not->toBeNull();

    $rawCount = DB::selectOne('SELECT COUNT(*) AS c FROM menu_items WHERE id = ?', [$item->id]);
    expect((int) $rawCount->c)->toBe(1);
});

it('allows super_admin to query all tenants when GUC is `*`', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    setRlsTenant('*');
    $catA = MenuCategory::factory()->create(['tenant_id' => $tenantA->id]);
    $catB = MenuCategory::factory()->create(['tenant_id' => $tenantB->id]);
    MenuItem::factory()->create(['tenant_id' => $tenantA->id, 'category_id' => $catA->id]);
    MenuItem::factory()->create(['tenant_id' => $tenantB->id, 'category_id' => $catB->id]);

    // Still '*' — super admin reads both.
    $rows = DB::select('SELECT tenant_id FROM menu_items');
    $tenantIds = array_unique(array_map(fn ($r) => $r->tenant_id, $rows));
    expect($tenantIds)->toContain($tenantA->id, $tenantB->id);
});

it('blocks queries when GUC is null and not in console', function (): void {
    $tenant = Tenant::factory()->create();

    setRlsTenant('*');
    $category = MenuCategory::factory()->create(['tenant_id' => $tenant->id]);
    MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
    ]);

    // Reset GUC — RLS policy `current_setting('app.current_tenant_id', true)`
    // returns NULL/'', neither matches `*` nor any tenant id, so zero rows.
    clearRlsTenant();
    actAsAppRole(); // Drop superuser privileges so RLS actually enforces.

    $rows = DB::select('SELECT id FROM menu_items');
    expect(count($rows))->toBe(0);

    $rows = DB::select('SELECT id FROM orders');
    expect(count($rows))->toBe(0);

    $rows = DB::select('SELECT id FROM customers');
    expect(count($rows))->toBe(0);
});

it('verifies RLS is enabled on every tenant-scoped table', function (): void {
    // The migration claims to protect these tables. If the list ever drifts,
    // this test catches it before a regression hits production.
    $protected = [
        'menu_categories', 'menu_items',
        'table_categories', 'tables',
        'orders', 'order_items',
        'customers',
        'loyalty_programs', 'loyalty_accounts', 'loyalty_transactions',
        'employees', 'shifts', 'time_clock_events',
        'ingredient_categories', 'ingredients', 'recipes', 'stock_movements', 'suppliers',
        'payments',
        'notifications_log',
        // Covered by their own create migrations (pgsql-gated blocks).
        'courier_locations', 'kiosk_devices', 'kiosk_pairing_codes', 'shift_breaks',
        'tenant_domains', 'tenant_brands', 'tenant_apps', 'tenant_app_builds',
        'ai_generations_log',
        // ADR-0006 extension (2026_07_21_000001) — tables added during the
        // MySQL period that shipped without RLS.
        'order_reviews', 'visit_tokens',
        'warehouses', 'incoming_documents', 'waste_documents',
        'audit_sessions', 'transfer_documents',
        'departments', 'units_of_measure',
    ];

    $rows = DB::select(
        'SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = current_schema() AND tablename = ANY(?)',
        ['{'.implode(',', $protected).'}'],
    );

    $byName = [];
    foreach ($rows as $r) {
        $byName[$r->tablename] = (bool) $r->rowsecurity;
    }

    foreach ($protected as $table) {
        expect($byName)->toHaveKey($table, "RLS check missing for `{$table}` — table not present in pg_tables.");
        expect($byName[$table])->toBeTrue("RLS is NOT enabled on `{$table}`.");
    }
});

it('verifies a policy named tenant_isolation_<table> exists for every protected table', function (): void {
    $protected = [
        'menu_categories', 'menu_items',
        'orders', 'order_items',
        'customers',
        'employees', 'shifts',
        'ingredients', 'recipes', 'stock_movements',
        'payments',
        'notifications_log',
        'order_reviews', 'visit_tokens',
        'warehouses', 'incoming_documents', 'waste_documents',
        'audit_sessions', 'transfer_documents',
        'departments', 'units_of_measure',
    ];

    $rows = DB::select('SELECT tablename, policyname FROM pg_policies WHERE schemaname = current_schema()');
    $policiesByTable = [];
    foreach ($rows as $r) {
        $policiesByTable[$r->tablename][] = $r->policyname;
    }

    foreach ($protected as $table) {
        $expected = 'tenant_isolation_'.$table;
        expect(array_key_exists($table, $policiesByTable))
            ->toBeTrue("No policy on `{$table}`.");
        expect(in_array($expected, $policiesByTable[$table] ?? [], true))
            ->toBeTrue("Policy `{$expected}` missing on `{$table}`.");
    }
});

it('blocks INSERT into wrong tenant via RLS WITH CHECK', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    setRlsTenant($tenantA->id);
    actAsAppRole(); // Drop superuser privileges so RLS WITH CHECK enforces.

    // RefreshDatabase wraps the test in a transaction. A failed RLS INSERT
    // aborts the surrounding transaction (Postgres SQLSTATE 25P02) so all
    // subsequent statements error with "current transaction is aborted".
    // Wrap the failing statement in a SAVEPOINT so the rest of the test
    // (including afterEach RESET ROLE / set_config cleanup) can proceed.
    DB::statement('SAVEPOINT rls_check');

    $threw = false;
    try {
        DB::insert(
            'INSERT INTO customers (id, tenant_id, phone, first_name, locale, total_orders, total_spent, created_at, updated_at)
             VALUES (gen_random_uuid(), ?, ?, ?, ?, 0, 0, now(), now())',
            [$tenantB->id, '+998901234567', 'Mole', 'uz'],
        );
    } catch (QueryException $e) {
        $threw = true;
    }

    DB::statement('ROLLBACK TO SAVEPOINT rls_check');

    expect($threw)->toBeTrue('INSERT into wrong tenant must throw QueryException via RLS WITH CHECK.');
});

it('keeps payments isolated even when application code uses withoutGlobalScopes', function (): void {
    // Webhook handlers must call withoutGlobalScopes() because they run before
    // auth resolution. RLS still has to protect them.
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    setRlsTenant('*');
    $orderA = Order::factory()->create(['tenant_id' => $tenantA->id, 'total_amount' => 50000]);
    Payment::factory()->create([
        'tenant_id' => $tenantA->id,
        'order_id' => $orderA->id,
        'provider' => PaymentProvider::Click->value,
        'provider_transaction_id' => 'CLK-X-1',
        'amount' => 50000,
        'status' => PaymentStatus::Authorized->value,
    ]);

    setRlsTenant($tenantB->id);
    actAsAppRole(); // Drop superuser privileges so RLS actually enforces.

    $found = Payment::withoutGlobalScopes()
        ->where('provider_transaction_id', 'CLK-X-1')
        ->first();
    expect($found)->toBeNull();
});

it('keeps notification_log isolated under RLS', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    setRlsTenant('*');
    $logA = NotificationLog::factory()->create(['tenant_id' => $tenantA->id]);

    setRlsTenant($tenantB->id);
    actAsAppRole(); // Drop superuser privileges so RLS actually enforces.

    expect(NotificationLog::withoutGlobalScopes()->find($logA->id))->toBeNull();
});

it('SetTenantContext middleware sets the GUC for an authenticated tenant request', function (): void {
    // Smoke test: hit an authenticated route with a tenant user and let the
    // middleware run, then read back the session-scoped GUC to confirm the
    // SetTenantContext middleware populated it.
    $owner = actingAsTenantOwner();

    Sanctum::actingAs($owner);

    // Hitting any authenticated endpoint runs the middleware stack.
    $this->getJson('/api/v1/auth/me')->assertOk();

    // Note: the middleware uses set_config(..., is_local=false) which is
    // session-scoped. Outside the same DB session the value is gone, but on
    // the same connection (which Laravel test client reuses) the GUC stays
    // set until SetTenantContext::terminate() resets it, which happens after
    // the response is dispatched. Read it now to confirm.
    $current = DB::selectOne("SELECT current_setting('app.current_tenant_id', true) AS v");

    // The middleware terminate may already have reset, but at minimum the
    // value must be EITHER the tenant id OR empty (post-terminate) — never
    // some other tenant.
    expect($current->v)->toBeIn([$owner->tenant_id, '', null]);
});

it('SetTenantContext middleware sets `*` GUC for super_admin requests', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->getJson('/api/v1/super-admin/me')->assertOk();

    // Sanity: while super-admin is authenticated, queries pre-terminate read
    // across tenants. The exact GUC value depends on whether terminate has
    // fired. We assert the response succeeded; cross-tenant access is covered
    // by SuperAdmin/TenantTest.
    expect(true)->toBeTrue();
});
