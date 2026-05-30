<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/waiters')->assertStatus(401);
});

it('aggregates orders by served_by waiter', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $tenant = $owner->tenant;

    $waiter = actingAsStaff('waiter', $tenant);
    $cashier = actingAsStaff('cashier', $tenant);

    Order::factory()->count(3)->create([
        'tenant_id' => $tenant->id,
        'served_by_id' => $waiter['employee']->id,
        'status' => 'completed',
        'total_amount' => 30_000,
        'guest_count' => 2,
    ]);
    Order::factory()->create([
        'tenant_id' => $tenant->id,
        'served_by_id' => $cashier['employee']->id,
        'status' => 'completed',
        'total_amount' => 100_000,
        'guest_count' => 3,
    ]);

    $response = $this->getJson('/api/v1/reports/waiters')->assertOk();

    $rows = $response->json('data');
    expect($rows)->toHaveCount(2);

    // Default sort = -revenue → cashier (100k) first, waiter (90k) second
    expect($rows[0]['revenue_minor'])->toBe(100_000);
    expect($rows[0]['position'])->toBe('cashier');
    expect($rows[1]['revenue_minor'])->toBe(90_000);
    expect($rows[1]['orders_count'])->toBe(3);
});

it('excludes couriers from the waiters report', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $tenant = $owner->tenant;

    $courier = actingAsStaff('courier', $tenant);
    Order::factory()->create([
        'tenant_id' => $tenant->id,
        'served_by_id' => $courier['employee']->id,
        'status' => 'completed',
        'total_amount' => 50_000,
    ]);

    $response = $this->getJson('/api/v1/reports/waiters')->assertOk();
    expect($response->json('data'))->toHaveCount(0);
});

it('can sort by orders count', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $tenant = $owner->tenant;

    $waiterA = actingAsStaff('waiter', $tenant);
    $waiterB = actingAsStaff('waiter', $tenant);

    Order::factory()->count(5)->create([
        'tenant_id' => $tenant->id,
        'served_by_id' => $waiterA['employee']->id,
        'status' => 'completed',
        'total_amount' => 10_000,
    ]);
    Order::factory()->count(2)->create([
        'tenant_id' => $tenant->id,
        'served_by_id' => $waiterB['employee']->id,
        'status' => 'completed',
        'total_amount' => 100_000,
    ]);

    // Default sort (revenue desc) puts waiterB first
    $byRevenue = $this->getJson('/api/v1/reports/waiters')->assertOk();
    expect($byRevenue->json('data.0.employee_id'))->toBe($waiterB['employee']->id);

    // Sort by orders asc puts waiterB (2 orders) first
    $byOrders = $this->getJson('/api/v1/reports/waiters?sort=orders')->assertOk();
    expect($byOrders->json('data.0.employee_id'))->toBe($waiterB['employee']->id);
});
