<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('lists ready unassigned delivery orders', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $available = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => null,
        'prepared_at' => now()->subMinutes(2),
    ]);
    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'pending',
        'courier_id' => null,
    ]);
    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
    ]);
    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'dine_in',
        'status' => 'ready',
        'courier_id' => null,
    ]);

    $response = $this->getJson('/api/v1/staff/courier/available')->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toBe([$available->id]);
});

it('blocks non-courier roles', function (): void {
    ['user' => $user] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/staff/courier/available')->assertForbidden();
});

it('does not leak orders from other tenants', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $otherTenant = \App\Domain\Tenant\Models\Tenant::factory()->create();
    Order::factory()->create([
        'tenant_id' => $otherTenant->id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => null,
    ]);

    $this->getJson('/api/v1/staff/courier/available')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});
