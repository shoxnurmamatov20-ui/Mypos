<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| ADR-0005 follow-up — App-layer tenant isolation (replaces RLS coverage)
|--------------------------------------------------------------------------
|
| When MyPOS used PostgreSQL we had two tenant-isolation layers:
|   1. App-layer Eloquent global scope `BelongsToTenant`
|   2. Postgres Row-Level Security policy `tenant_isolation_<table>`
|
| ADR-0005 (2026-05-10) moved the project to MySQL. RLS is gone.
| `BelongsToTenant` is now the SOLE guard. This test file enforces the
| invariants that RLS used to catch implicitly:
|
|   - The global scope filters by tenant_id when a tenant is bound.
|   - The trait fail-closes (`whereRaw('1=0')`) when no tenant context
|     exists, instead of silently returning every row.
|   - `withoutGlobalScope('tenant')` opt-out is intentional and every
|     such call in production code re-applies an explicit tenant_id
|     filter (audited by grep, asserted at runtime here for the
|     repository / Action paths we control).
|
| If any of these tests fail, the application has a cross-tenant data
| leak. Treat the failure as production-blocking.
*/

use App\Domain\Customer\Actions\RecordOrderForCustomerAction;
use App\Domain\Customer\Models\Customer;
use App\Domain\Customer\Models\LoyaltyAccount;
use App\Domain\Customer\Models\LoyaltyProgram;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;

it('global scope hides rows from other tenants', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $userA = User::factory()->create(['tenant_id' => $tenantA->id]);
    app()->instance('currentTenant', $tenantA);
    auth()->setUser($userA);

    MenuCategory::factory()->forTenant($tenantA)->count(2)->create();
    MenuCategory::factory()->forTenant($tenantB)->count(3)->create();

    expect(MenuCategory::query()->count())->toBe(2);
});

it('global scope returns zero rows when no tenant context (default-deny)', function (): void {
    $tenantA = Tenant::factory()->create();
    MenuItem::factory()->forTenant($tenantA)->count(5)->create();

    // No `app('currentTenant')`, no auth user → BelongsToTenant must clamp.
    app()->forgetInstance('currentTenant');
    auth()->forgetUser();

    expect(MenuItem::query()->count())->toBe(0);
});

it('explicit withoutGlobalScope still requires a tenant_id filter to be safe', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    Order::factory()->forTenant($tenantA)->count(2)->create();
    Order::factory()->forTenant($tenantB)->count(3)->create();

    $unsafeCount = Order::withoutGlobalScopes(['tenant'])->count();
    $safeCount = Order::withoutGlobalScopes(['tenant'])
        ->where('tenant_id', $tenantA->id)
        ->count();

    expect($unsafeCount)->toBe(5);          // both tenants — proves the leak surface
    expect($safeCount)->toBe(2);            // tenant_id filter restores isolation
});

it('RecordOrderForCustomerAction does not credit cross-tenant customer (Audit C-1 regression)', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $customerA = Customer::factory()->forTenant($tenantA)->create();
    $customerB = Customer::factory()->forTenant($tenantB)->create();

    // A loyalty program belonging to tenant B (the wrong tenant for the order).
    $programB = LoyaltyProgram::factory()->forTenant($tenantB)->active()->create();

    $orderA = Order::factory()->forTenant($tenantA)->paid()->create([
        'customer_id' => $customerB->id,    // <-- intentional bad cross-tenant id
        'total_amount' => 100_000,
    ]);

    (new RecordOrderForCustomerAction())->execute($orderA);

    // Customer B (other tenant) must NOT have been mutated.
    expect($customerB->refresh()->total_orders)->toBe(0);
    expect($customerB->total_spent)->toBe(0);

    // No loyalty account should exist for customer B under program B as a
    // side effect of an order that belonged to tenant A.
    $leakedAccount = LoyaltyAccount::query()
        ->withoutGlobalScopes(['tenant'])
        ->where('customer_id', $customerB->id)
        ->where('program_id', $programB->id)
        ->first();
    expect($leakedAccount)->toBeNull();
});

it('switching tenant context flips visible rows', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    MenuItem::factory()->forTenant($tenantA)->count(4)->create();
    MenuItem::factory()->forTenant($tenantB)->count(7)->create();

    app()->instance('currentTenant', $tenantA);
    expect(MenuItem::query()->count())->toBe(4);

    app()->instance('currentTenant', $tenantB);
    expect(MenuItem::query()->count())->toBe(7);
});
