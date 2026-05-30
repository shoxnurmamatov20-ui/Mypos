<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/menu-items')->assertStatus(401);
});

it('aggregates per menu item with revenue and gross profit', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $category = MenuCategory::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'name' => ['uz' => 'Asosiy taomlar'],
    ]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'name' => ['uz' => 'Lag\'mon'],
        'cost_amount' => 8_000,
    ]);

    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
    ]);

    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $item->id,
        'name_snapshot' => 'Lag\'mon',
        'quantity' => 4,
        'price_amount' => 25_000,
        'subtotal_amount' => 100_000,
        'status' => 'served',
    ]);

    $response = $this->getJson('/api/v1/reports/menu-items')->assertOk();

    $row = $response->json('data.0');
    expect($row['name'])->toBe('Lag\'mon');
    expect($row['category_name'])->toBe('Asosiy taomlar');
    expect((float) $row['quantity_sold'])->toBe(4.0);
    expect($row['revenue_minor'])->toBe(100_000);
    expect($row['cost_minor'])->toBe(32_000);  // 4 × 8_000
    expect($row['gross_profit_minor'])->toBe(68_000);
});

it('sorts by quantity vs revenue', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $cheap = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'name' => ['uz' => 'Choy'],
        'cost_amount' => 1_000,
    ]);
    $expensive = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'name' => ['uz' => 'Tovuq'],
        'cost_amount' => 50_000,
    ]);

    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
    ]);

    // 100 cups of tea (5_000 each) = 500_000 revenue
    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $cheap->id,
        'name_snapshot' => 'Choy',
        'quantity' => 100,
        'price_amount' => 5_000,
        'subtotal_amount' => 500_000,
        'status' => 'served',
    ]);
    // 5 chickens (150_000 each) = 750_000 revenue
    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $expensive->id,
        'name_snapshot' => 'Tovuq',
        'quantity' => 5,
        'price_amount' => 150_000,
        'subtotal_amount' => 750_000,
        'status' => 'served',
    ]);

    // Default = -revenue → expensive first
    $byRevenue = $this->getJson('/api/v1/reports/menu-items')->assertOk();
    expect($byRevenue->json('data.0.name'))->toBe('Tovuq');

    // -quantity → cheap (100) first
    $byQuantity = $this->getJson('/api/v1/reports/menu-items?sort=-quantity')->assertOk();
    expect($byQuantity->json('data.0.name'))->toBe('Choy');
});

it('filters by category_id', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $catA = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $catB = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);

    $itemA = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $catA->id,
    ]);
    $itemB = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $catB->id,
    ]);

    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $itemA->id,
        'status' => 'served',
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $itemB->id,
        'status' => 'served',
    ]);

    $response = $this->getJson('/api/v1/reports/menu-items?category_id=' . $catA->id)->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.menu_item_id'))->toBe($itemA->id);
});
