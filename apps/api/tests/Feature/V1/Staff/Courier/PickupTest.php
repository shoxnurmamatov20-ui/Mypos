<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('marks the order picked up and sets timestamps', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/pickup")
        ->assertOk()
        ->assertJsonPath('data.derived_state', 'delivering');

    $fresh = $order->fresh();
    expect($fresh->picked_up_at)->not->toBeNull();
    expect($fresh->delivering_at)->not->toBeNull();
    expect($fresh->status)->toBe('ready'); // status unchanged by design
});

it('rejects pickup of an order assigned to a different courier', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    ['employee' => $other] = actingAsCourier(
        \App\Domain\Tenant\Models\Tenant::find($courier->tenant_id),
    );

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $other->id,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/pickup")
        ->assertStatus(403);
});

it('cannot pickup the same order twice', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'picked_up_at' => now()->subMinute(),
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/pickup")
        ->assertStatus(422);
});
