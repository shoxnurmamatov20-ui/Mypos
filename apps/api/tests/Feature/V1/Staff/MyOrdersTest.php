<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns only orders served by or created by the current employee', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $mine = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'served_by_id' => $employee->id,
        'status' => 'pending',
    ]);
    $alsoMine = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'employee_id' => $user->uuid,
        'status' => 'preparing',
    ]);
    Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'served_by_id' => null,
        'status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/staff/orders/my')->assertOk();
    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($mine->id);
    expect($ids)->toContain($alsoMine->id);
    expect(count($ids))->toBe(2);
});

it('filters by comma-separated statuses', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $pending = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'served_by_id' => $employee->id,
        'status' => 'pending',
    ]);
    Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'served_by_id' => $employee->id,
        'status' => 'completed',
    ]);

    $response = $this->getJson('/api/v1/staff/orders/my?status=pending,preparing')->assertOk();
    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toBe([$pending->id]);
});

it('does not show orders from other employees', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    ['employee' => $other] = actingAsStaff(
        'waiter',
        \App\Domain\Tenant\Models\Tenant::find($employee->tenant_id),
    );

    Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'served_by_id' => $other->id,
        'status' => 'pending',
    ]);

    $this->getJson('/api/v1/staff/orders/my')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});
