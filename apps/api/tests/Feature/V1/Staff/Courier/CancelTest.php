<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('cancels an in-progress delivery and stores reason', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'picked_up_at' => now()->subMinutes(5),
        'notes' => 'orig notes',
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/cancel", [
        'reason' => 'customer_unavailable',
        'notes' => 'No answer at door',
    ])->assertOk();

    $fresh = $order->fresh();
    expect($fresh->status)->toBe('cancelled');
    expect($fresh->cancelled_at)->not->toBeNull();
    expect($fresh->metadata['delivery_cancel_reason'] ?? null)->toBe('customer_unavailable');
    expect($fresh->metadata['delivery_cancel_notes'] ?? null)->toBe('No answer at door');
    expect($fresh->notes)->toContain('orig notes');
    expect($fresh->courier_id)->toBe($courier->id); // preserved for accountability
});

it('rejects an unknown cancel reason', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/cancel", [
        'reason' => 'aliens',
    ])->assertStatus(422)->assertJsonValidationErrors(['reason']);
});

it('cannot cancel an already-delivered order', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->subMinute(),
    ]);

    $this->postJson("/api/v1/staff/courier/orders/{$order->id}/cancel", [
        'reason' => 'other',
    ])->assertStatus(422);
});
