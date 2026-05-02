<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Laravel\Sanctum\Sanctum;

it('returns pending and preparing orders sorted oldest first', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $category = MenuCategory::factory()->create(['tenant_id' => $employee->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'category_id' => $category->id,
    ]);

    $older = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'pending',
        'placed_at' => now()->subMinutes(20),
        'created_at' => now()->subMinutes(20),
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'order_id' => $older->id,
        'menu_item_id' => $item->id,
        'status' => 'pending',
    ]);

    $newer = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'preparing',
        'placed_at' => now()->subMinutes(5),
        'created_at' => now()->subMinutes(5),
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'order_id' => $newer->id,
        'menu_item_id' => $item->id,
        'status' => 'preparing',
    ]);

    $response = $this->getJson('/api/v1/staff/kitchen/queue')
        ->assertOk()
        ->assertJsonStructure(['data' => [['id', 'order_no', 'items']]]);

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids[0])->toBe($older->id);
    expect($ids[1])->toBe($newer->id);
});

it('excludes already-served orders', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $category = MenuCategory::factory()->create(['tenant_id' => $employee->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'category_id' => $category->id,
    ]);

    $served = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'served',
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'order_id' => $served->id,
        'menu_item_id' => $item->id,
        'status' => 'served',
    ]);

    $this->getJson('/api/v1/staff/kitchen/queue')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('excludes orders whose items are all ready', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $category = MenuCategory::factory()->create(['tenant_id' => $employee->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'category_id' => $category->id,
    ]);

    $order = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'preparing',
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $item->id,
        'status' => 'ready',
    ]);

    $this->getJson('/api/v1/staff/kitchen/queue')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('shows elapsed_seconds field for each order', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $category = MenuCategory::factory()->create(['tenant_id' => $employee->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'category_id' => $category->id,
    ]);

    $order = Order::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'status' => 'pending',
        'placed_at' => now()->subSeconds(120),
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $item->id,
        'status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/staff/kitchen/queue')->assertOk();
    expect($response->json('data.0.elapsed_seconds'))->toBeGreaterThanOrEqual(110);
});
