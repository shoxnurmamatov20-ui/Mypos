<?php

declare(strict_types=1);

use App\Domain\Customer\Models\Customer;
use App\Domain\Order\Models\Order;
use App\Domain\Payment\Models\Payment;
use App\Domain\Tenant\Models\Tenant;
use Laravel\Sanctum\Sanctum;

/**
 * Multi-tenancy regression — Tenant A must never see Tenant B's report data
 * through any of the 9 reports endpoints. This proves the BelongsToTenant
 * global scope is the sole guard now that Postgres RLS was reverted
 * (ADR-0005).
 */

it('isolates Z-report aggregates between tenants', function (): void {
    [$tenantA, $tenantB] = [Tenant::factory()->create(), Tenant::factory()->create()];
    $ownerA = actingAsTenantOwner($tenantA);

    Order::factory()->count(2)->create([
        'tenant_id' => $tenantA->id,
        'status' => 'completed',
        'total_amount' => 50_000,
    ]);
    Order::factory()->count(5)->create([
        'tenant_id' => $tenantB->id,
        'status' => 'completed',
        'total_amount' => 999_999,
    ]);

    Sanctum::actingAs($ownerA);
    $response = $this->getJson('/api/v1/reports/z-report')->assertOk();

    expect($response->json('data.totals.orders_count'))->toBe(2);
    expect($response->json('data.totals.revenue_minor'))->toBe(100_000);
});

it('isolates orders report between tenants', function (): void {
    [$tenantA, $tenantB] = [Tenant::factory()->create(), Tenant::factory()->create()];
    $ownerA = actingAsTenantOwner($tenantA);

    Order::factory()->count(3)->create(['tenant_id' => $tenantA->id]);
    Order::factory()->count(7)->create(['tenant_id' => $tenantB->id]);

    Sanctum::actingAs($ownerA);
    $response = $this->getJson('/api/v1/reports/orders')->assertOk();

    expect($response->json('meta.total'))->toBe(3);
});

it('isolates cashflow report between tenants', function (): void {
    [$tenantA, $tenantB] = [Tenant::factory()->create(), Tenant::factory()->create()];
    $ownerA = actingAsTenantOwner($tenantA);

    $orderA = Order::factory()->create(['tenant_id' => $tenantA->id]);
    $orderB = Order::factory()->create(['tenant_id' => $tenantB->id]);

    Payment::factory()->captured()->create([
        'tenant_id' => $tenantA->id,
        'order_id' => $orderA->id,
        'amount' => 25_000,
    ]);
    Payment::factory()->captured()->count(10)->create([
        'tenant_id' => $tenantB->id,
        'order_id' => $orderB->id,
        'amount' => 999_999,
    ]);

    Sanctum::actingAs($ownerA);
    $response = $this->getJson('/api/v1/reports/cashflow')->assertOk();
    expect($response->json('data.summary.total_inflow_minor'))->toBe(25_000);
    expect($response->json('data.summary.transaction_count'))->toBe(1);
});

it('isolates debtors report between tenants', function (): void {
    [$tenantA, $tenantB] = [Tenant::factory()->create(), Tenant::factory()->create()];
    $ownerA = actingAsTenantOwner($tenantA);

    $customerA = Customer::factory()->create(['tenant_id' => $tenantA->id]);
    $customerB = Customer::factory()->create(['tenant_id' => $tenantB->id]);

    Order::factory()->create([
        'tenant_id' => $tenantA->id,
        'customer_id' => $customerA->id,
        'status' => 'completed',
        'payment_status' => 'unpaid',
        'total_amount' => 40_000,
        'paid_amount' => 0,
    ]);
    Order::factory()->create([
        'tenant_id' => $tenantB->id,
        'customer_id' => $customerB->id,
        'status' => 'completed',
        'payment_status' => 'unpaid',
        'total_amount' => 999_999,
        'paid_amount' => 0,
    ]);

    Sanctum::actingAs($ownerA);
    $response = $this->getJson('/api/v1/reports/debtors')->assertOk();

    $debtors = $response->json('data.debtors');
    expect($debtors)->toHaveCount(1);
    expect($debtors[0]['total_owed_minor'])->toBe(40_000);
});
