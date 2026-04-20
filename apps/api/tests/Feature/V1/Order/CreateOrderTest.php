<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Table\Models\Table;
use Laravel\Sanctum\Sanctum;

it('returns 401 for unauthenticated requests', function (): void {
    $this->postJson('/api/v1/orders', [])->assertStatus(401);
});

it('lets an owner create an order with items', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'price_amount' => 25000,
        'has_discount' => false,
    ]);
    $table = Table::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/orders', [
        'type' => 'dine_in',
        'table_id' => $table->id,
        'items' => [
            ['menu_item_id' => $item->id, 'quantity' => 2],
        ],
    ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.amounts.subtotal', 50000)
        ->assertJsonPath('data.amounts.total', 50000);

    expect($response->json('data.items'))->toHaveCount(1);
    expect($response->json('data.items.0.quantity'))->toBe(2);
});

it('assigns an order_no starting with O + today date', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
    ]);
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/orders', [
        'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
    ])->assertCreated();

    $orderNo = $response->json('data.order_no');
    $expectedPrefix = 'O' . now()->format('ymd');

    expect($orderNo)->toStartWith($expectedPrefix);
});

it('computes total_amount as the sum of line subtotals', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $itemA = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'price_amount' => 10000,
        'has_discount' => false,
    ]);
    $itemB = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'price_amount' => 15000,
        'has_discount' => false,
    ]);
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/orders', [
        'items' => [
            ['menu_item_id' => $itemA->id, 'quantity' => 2], // 20000
            ['menu_item_id' => $itemB->id, 'quantity' => 3], // 45000
        ],
    ])->assertCreated();

    expect($response->json('data.amounts.subtotal'))->toBe(65000);
    expect($response->json('data.amounts.total'))->toBe(65000);
});

it('occupies the table when a dine-in order is placed', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
    ]);
    $table = Table::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'available',
    ]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/orders', [
        'table_id' => $table->id,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
    ])->assertCreated();

    expect($table->fresh()->status)->toBe('occupied');
});

it('rejects an order with an invalid menu_item_id', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/orders', [
        'items' => [
            ['menu_item_id' => '00000000-0000-0000-0000-000000000000', 'quantity' => 1],
        ],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items.0.menu_item_id']);
});

it('rejects an order with empty items', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/orders', [
        'items' => [],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});

it('rejects a quantity of zero', function (): void {
    $owner = actingAsTenantOwner();
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
    ]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/orders', [
        'items' => [['menu_item_id' => $item->id, 'quantity' => 0]],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items.0.quantity']);
});
