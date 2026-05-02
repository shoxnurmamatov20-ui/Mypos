<?php

declare(strict_types=1);

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;

it('returns an order owned by the calling kiosk', function (): void {
    $tenant = Tenant::factory()->create();
    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $paired['device']->id,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->getJson('/api/v1/kiosk/orders/' . $order->id)
        ->assertOk()
        ->assertJsonPath('data.id', $order->id)
        ->assertJsonPath('data.kiosk_device_id', $paired['device']->id);
});

it('returns 404 for an order owned by another kiosk in same tenant', function (): void {
    $tenant = Tenant::factory()->create();
    $deviceA = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);
    $deviceB = KioskDevice::factory()->create(['tenant_id' => $tenant->id]);

    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $deviceB->id,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $deviceA['token'])
        ->getJson('/api/v1/kiosk/orders/' . $order->id)
        ->assertNotFound();
});

it('returns 404 for an order in another tenant', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenantA->id]);

    $order = Order::factory()->create(['tenant_id' => $tenantB->id]);

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->getJson('/api/v1/kiosk/orders/' . $order->id)
        ->assertNotFound();
});

it('requires a device token', function (): void {
    $this->getJson('/api/v1/kiosk/orders/00000000-0000-0000-0000-000000000000')
        ->assertStatus(401);
});
