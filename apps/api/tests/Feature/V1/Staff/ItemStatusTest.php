<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Laravel\Sanctum\Sanctum;

function makeItem(string $tenantId, string $orderId, string $status = 'pending'): OrderItem
{
    $category = MenuCategory::factory()->create(['tenant_id' => $tenantId]);
    $menuItem = MenuItem::factory()->create([
        'tenant_id' => $tenantId,
        'category_id' => $category->id,
    ]);

    return OrderItem::factory()->create([
        'tenant_id' => $tenantId,
        'order_id' => $orderId,
        'menu_item_id' => $menuItem->id,
        'status' => $status,
    ]);
}

it('claims an item by transitioning pending → preparing', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'pending',
    ]);
    $item = makeItem($employee->tenant_id, $order->id, 'pending');

    $this->patchJson("/api/v1/staff/orders/{$order->id}/items/{$item->id}/status", [
        'status' => 'preparing',
    ])->assertOk();

    $item->refresh();
    expect($item->status)->toBe('preparing');
    expect($item->cook_id)->toBe($employee->id);
    expect($item->started_preparing_at)->not->toBeNull();
});

it('computes prep_duration_seconds when transitioning preparing → ready', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'preparing',
    ]);
    $item = makeItem($employee->tenant_id, $order->id, 'preparing');
    $item->update([
        'cook_id' => $employee->id,
        'started_preparing_at' => now()->subMinutes(3),
    ]);

    $this->patchJson("/api/v1/staff/orders/{$order->id}/items/{$item->id}/status", [
        'status' => 'ready',
    ])->assertOk();

    $item->refresh();
    expect($item->status)->toBe('ready');
    expect($item->ready_at)->not->toBeNull();
    expect($item->prep_duration_seconds)->toBeGreaterThanOrEqual(170);
});

it('rejects an invalid status transition', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'pending',
    ]);
    $item = makeItem($employee->tenant_id, $order->id, 'pending');

    $this->patchJson("/api/v1/staff/orders/{$order->id}/items/{$item->id}/status", [
        'status' => 'ready', // pending → ready is not allowed (must go through preparing)
    ])->assertStatus(422)->assertJsonValidationErrors(['status']);
});

it('promotes the order to ready when all items become ready', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $order = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'preparing',
    ]);
    $item = makeItem($employee->tenant_id, $order->id, 'preparing');
    $item->update([
        'cook_id' => $employee->id,
        'started_preparing_at' => now()->subMinute(),
    ]);

    $this->patchJson("/api/v1/staff/orders/{$order->id}/items/{$item->id}/status", [
        'status' => 'ready',
    ])->assertOk();

    expect($order->fresh()->status)->toBe('ready');
});

it('rejects updating an item that does not belong to the order', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $orderA = Order::factory()->create(['tenant_id' => $employee->tenant_id, 'status' => 'pending']);
    $orderB = Order::factory()->create(['tenant_id' => $employee->tenant_id, 'status' => 'pending']);
    $item = makeItem($employee->tenant_id, $orderB->id, 'pending');

    $this->patchJson("/api/v1/staff/orders/{$orderA->id}/items/{$item->id}/status", [
        'status' => 'preparing',
    ])->assertStatus(422);
});
