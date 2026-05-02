<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('claims an unassigned ready delivery', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => null,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/accept")
        ->assertOk()
        ->assertJsonPath('data.id', $order->id);

    expect($order->fresh()->courier_id)->toBe($courier->id);
});

it('returns 409 when the order has already been taken', function (): void {
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

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/accept")
        ->assertStatus(409);

    expect($order->fresh()->courier_id)->toBe($other->id);
});

it('rejects orders that are not ready', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'preparing',
        'courier_id' => null,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/accept")
        ->assertStatus(409);
});

it('rejects non-delivery orders', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'dine_in',
        'status' => 'ready',
        'courier_id' => null,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/accept")
        ->assertStatus(409);
});

it('blocks waiters', function (): void {
    ['user' => $user, 'employee' => $waiter] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $waiter->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => null,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/accept")
        ->assertForbidden();
});
