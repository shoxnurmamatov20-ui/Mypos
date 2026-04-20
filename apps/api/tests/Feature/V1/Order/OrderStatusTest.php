<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Table\Models\Table;
use Laravel\Sanctum\Sanctum;

it('allows valid transition pending -> preparing', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'pending',
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'preparing'])
        ->assertOk()
        ->assertJsonPath('data.status', 'preparing');
});

it('runs the full happy-path chain pending -> preparing -> ready -> served -> completed', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'pending',
    ]);
    Sanctum::actingAs($owner);

    foreach (['preparing', 'ready', 'served', 'completed'] as $next) {
        $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => $next])
            ->assertOk()
            ->assertJsonPath('data.status', $next);
    }
});

it('rejects invalid skip pending -> ready', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'pending',
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'ready'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('rejects an unknown status value', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'pending',
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'nonsense'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('frees the table on completed', function (): void {
    $owner = actingAsTenantOwner();
    $table = Table::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'occupied',
    ]);
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'table_id' => $table->id,
        'status' => 'served',
        'total_amount' => 50000,
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'completed'])
        ->assertOk()
        ->assertJsonPath('data.status', 'completed');

    expect($table->fresh()->status)->toBe('available');
});

it('frees the table on cancellation', function (): void {
    $owner = actingAsTenantOwner();
    $table = Table::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'occupied',
    ]);
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'table_id' => $table->id,
        'status' => 'pending',
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'cancelled'])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    expect($table->fresh()->status)->toBe('available');
});

it('auto-marks an unpaid order as paid on completion', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'served',
        'payment_status' => 'unpaid',
        'total_amount' => 42000,
        'paid_amount' => 0,
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'completed'])
        ->assertOk()
        ->assertJsonPath('data.payment_status', 'paid')
        ->assertJsonPath('data.amounts.paid', 42000);
});

it('rejects transitions from a terminal state', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
    ]);
    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'pending'])
        ->assertStatus(422);
});
