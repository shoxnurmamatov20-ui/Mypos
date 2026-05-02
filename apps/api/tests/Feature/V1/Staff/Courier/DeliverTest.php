<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('marks delivered without payment when no cash is provided', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'picked_up_at' => now()->subMinutes(15),
        'total_amount' => 95_000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/deliver", [])
        ->assertOk()
        ->assertJsonPath('data.derived_state', 'delivered');

    $fresh = $order->fresh();
    expect($fresh->status)->toBe('completed');
    expect($fresh->delivered_at)->not->toBeNull();
    expect($fresh->payment_status)->toBe('unpaid');
});

it('records cash receipt and marks paid when amount covers total', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'picked_up_at' => now()->subMinutes(10),
        'total_amount' => 95_000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/deliver", [
        'received_amount' => 100_000,
        'payment_method' => 'cash',
    ])->assertOk();

    $fresh = $order->fresh();
    expect($fresh->status)->toBe('completed');
    expect($fresh->payment_status)->toBe('paid');
    expect($fresh->paid_amount)->toBe(95_000);
    expect($fresh->payment_method)->toBe('cash');
});

it('does not mark paid if received_amount is less than total', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'total_amount' => 95_000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/deliver", [
        'received_amount' => 50_000,
    ])->assertOk();

    expect($order->fresh()->payment_status)->toBe('unpaid');
});

it('rejects delivery for a different courier\'s order', function (): void {
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

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/deliver")
        ->assertStatus(403);
});
