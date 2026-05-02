<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns null when no active delivery exists', function (): void {
    ['user' => $user] = actingAsCourier();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/staff/courier/active')
        ->assertOk()
        ->assertJsonPath('data', null);
});

it('returns the in-progress delivery', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'picked_up_at' => now()->subMinutes(3),
    ]);

    $this->getJson('/api/v1/staff/courier/active')
        ->assertOk()
        ->assertJsonPath('data.id', $order->id)
        ->assertJsonPath('data.derived_state', 'delivering');
});

it('does not return delivered or cancelled orders', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->subMinute(),
    ]);
    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'cancelled',
        'courier_id' => $courier->id,
        'cancelled_at' => now()->subMinute(),
    ]);

    $this->getJson('/api/v1/staff/courier/active')
        ->assertOk()
        ->assertJsonPath('data', null);
});
