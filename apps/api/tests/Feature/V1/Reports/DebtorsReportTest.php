<?php

declare(strict_types=1);

use App\Domain\Customer\Models\Customer;
use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/debtors')->assertStatus(401);
});

it('lists customers with unpaid balances', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $customerA = Customer::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'first_name' => 'Akmal',
        'last_name' => 'Karimov',
    ]);
    $customerB = Customer::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'first_name' => 'Bekzod',
    ]);

    // Customer A: 1 order, owes 40_000
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'customer_id' => $customerA->id,
        'status' => 'completed',
        'payment_status' => 'partial',
        'total_amount' => 60_000,
        'paid_amount' => 20_000,
    ]);
    // Customer B: 2 orders, owes 100_000 total
    Order::factory()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'customer_id' => $customerB->id,
        'status' => 'served',
        'payment_status' => 'unpaid',
        'total_amount' => 50_000,
        'paid_amount' => 0,
    ]);
    // Paid order — should not appear
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'customer_id' => $customerA->id,
        'status' => 'completed',
        'payment_status' => 'paid',
        'total_amount' => 30_000,
        'paid_amount' => 30_000,
    ]);

    $response = $this->getJson('/api/v1/reports/debtors')->assertOk();

    $debtors = $response->json('data.debtors');
    expect($debtors)->toHaveCount(2);

    // Sorted by amount desc → Bekzod (100k) first
    expect($debtors[0]['total_owed_minor'])->toBe(100_000);
    expect($debtors[0]['orders_count'])->toBe(2);
    expect($debtors[1]['total_owed_minor'])->toBe(40_000);

    expect($response->json('data.summary.debtors_total_minor'))->toBe(140_000);
    expect($response->json('data.creditors'))->toBe([]);
});

it('excludes cancelled orders from the debt calculation', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $customer = Customer::factory()->create(['tenant_id' => $owner->tenant_id]);

    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'customer_id' => $customer->id,
        'status' => 'cancelled',
        'payment_status' => 'unpaid',
        'total_amount' => 999_999,
    ]);

    $response = $this->getJson('/api/v1/reports/debtors')->assertOk();
    expect($response->json('data.debtors'))->toHaveCount(0);
});

it('ignores orders with no attached customer', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'customer_id' => null,
        'status' => 'completed',
        'payment_status' => 'unpaid',
        'total_amount' => 100_000,
    ]);

    $response = $this->getJson('/api/v1/reports/debtors')->assertOk();
    expect($response->json('data.debtors'))->toHaveCount(0);
});
