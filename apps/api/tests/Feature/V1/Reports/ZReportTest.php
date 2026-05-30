<?php

declare(strict_types=1);

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Payment\Models\Payment;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/z-report')->assertStatus(401);
});

it('returns 403 to staff without managerial role', function (): void {
    $staff = actingAsStaff('waiter');
    Sanctum::actingAs($staff['user']);

    $this->getJson('/api/v1/reports/z-report')->assertStatus(403);
});

it('aggregates totals for the requested day', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    Order::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
        'type' => 'dine_in',
        'total_amount' => 50_000,
        'tax_amount' => 5_000,
        'discount_amount' => 2_000,
        'created_at' => now(),
    ]);

    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
        'total_amount' => 10_000,
        'created_at' => now(),
    ]);

    // Out-of-window — should be ignored
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
        'total_amount' => 999_999,
        'created_at' => now()->subDays(5),
    ]);

    $response = $this->getJson('/api/v1/reports/z-report')
        ->assertOk()
        ->assertJsonPath('data.totals.orders_count', 3)
        ->assertJsonPath('data.totals.revenue_minor', 150_000)
        ->assertJsonPath('data.totals.tax_minor', 15_000)
        ->assertJsonPath('data.totals.discount_minor', 6_000)
        ->assertJsonPath('data.totals.net_revenue_minor', 135_000)
        ->assertJsonPath('data.totals.avg_ticket_minor', 50_000);

    expect($response->json('data.by_status.completed'))->toBe(3);
    expect($response->json('data.by_status.cancelled'))->toBe(1);
});

it('groups orders by type', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    Order::factory()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'type' => 'dine_in',
        'status' => 'completed',
        'total_amount' => 30_000,
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'total_amount' => 75_000,
    ]);

    $response = $this->getJson('/api/v1/reports/z-report')->assertOk();

    expect($response->json('data.by_type.dine_in.count'))->toBe(2);
    expect($response->json('data.by_type.dine_in.revenue_minor'))->toBe(60_000);
    expect($response->json('data.by_type.delivery.count'))->toBe(1);
    expect($response->json('data.by_type.delivery.revenue_minor'))->toBe(75_000);
});

it('returns top items sorted by revenue', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $category = MenuCategory::factory()->create(['tenant_id' => $owner->tenant_id]);
    $itemA = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'name' => ['uz' => 'Plov', 'ru' => 'Плов', 'en' => 'Pilaf'],
    ]);
    $itemB = MenuItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'name' => ['uz' => 'Shashlik', 'ru' => 'Шашлык', 'en' => 'Kebab'],
    ]);

    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
        'total_amount' => 200_000,
    ]);

    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $itemA->id,
        'name_snapshot' => 'Plov',
        'quantity' => 2,
        'price_amount' => 25_000,
        'subtotal_amount' => 50_000,
        'status' => 'served',
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'menu_item_id' => $itemB->id,
        'name_snapshot' => 'Shashlik',
        'quantity' => 5,
        'price_amount' => 30_000,
        'subtotal_amount' => 150_000,
        'status' => 'served',
    ]);

    $response = $this->getJson('/api/v1/reports/z-report')->assertOk();

    $topItems = $response->json('data.top_items');
    expect($topItems)->toHaveCount(2);
    // Shashlik first because revenue (150k) > Plov (50k)
    expect($topItems[0]['name'])->toBe('Shashlik');
    expect($topItems[0]['revenue_minor'])->toBe(150_000);
    expect((float) $topItems[0]['quantity_sold'])->toBe(5.0);
});

it('returns captured payments grouped by provider with percentages', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
    ]);

    Payment::factory()->captured()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => 'cash',
        'amount' => 50_000,
    ]);
    Payment::factory()->captured()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => 'click',
        'amount' => 100_000,
    ]);

    $response = $this->getJson('/api/v1/reports/z-report')->assertOk();

    $payments = collect($response->json('data.payments'));
    expect($payments)->toHaveCount(2);

    $cash = $payments->firstWhere('provider', 'cash');
    expect($cash['count'])->toBe(2);
    expect($cash['amount_minor'])->toBe(100_000);
    expect((float) $cash['percent'])->toBe(50.0);
});
