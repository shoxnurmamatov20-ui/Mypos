<?php

declare(strict_types=1);

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;

it('places a kiosk order with type=kiosk and stamps device id', function (): void {
    $tenant = Tenant::factory()->create();
    $category = MenuCategory::factory()->create(['tenant_id' => $tenant->id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'price_amount' => 25000,
        'has_discount' => false,
    ]);

    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/orders', [
            'items' => [
                ['menu_item_id' => $item->id, 'quantity' => 2],
            ],
            'customer_phone_for_receipt' => '+998901234567',
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', OrderType::Kiosk->value)
        ->assertJsonPath('data.kiosk_device_id', $paired['device']->id)
        ->assertJsonPath('data.customer_phone_for_receipt', '+998901234567')
        ->assertJsonPath('data.amounts.subtotal', 50000)
        ->assertJsonPath('data.amounts.total', 50000);

    expect($response->json('data.kiosk_session_id'))->not->toBeNull();
    expect(Order::query()->withoutGlobalScopes()->where('tenant_id', $tenant->id)->count())->toBe(1);

    $order = Order::query()->withoutGlobalScopes()->first();
    expect($order->kiosk_device_id)->toBe($paired['device']->id);
    expect($order->type)->toBe(OrderType::Kiosk->value);
});

it('uses the supplied session_id when provided', function (): void {
    $tenant = Tenant::factory()->create();
    $category = MenuCategory::factory()->create(['tenant_id' => $tenant->id]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
    ]);

    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);
    $sessionId = '00000000-0000-0000-0000-0000000000aa';

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/orders', [
            'session_id' => $sessionId,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])
        ->assertCreated()
        ->assertJsonPath('data.kiosk_session_id', $sessionId);
});

it('rejects an order with empty items', function (): void {
    $paired = KioskDevice::factory()->createWithToken();

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/orders', [
            'items' => [],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});

it('rejects items from another tenant', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $catB = MenuCategory::factory()->create(['tenant_id' => $tenantB->id]);
    $itemB = MenuItem::factory()->create([
        'tenant_id' => $tenantB->id,
        'category_id' => $catB->id,
    ]);

    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenantA->id]);

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/orders', [
            'items' => [['menu_item_id' => $itemB->id, 'quantity' => 1]],
        ])
        ->assertStatus(422);
});

it('requires a device token', function (): void {
    $this->postJson('/api/v1/kiosk/orders', [])->assertStatus(401);
});
