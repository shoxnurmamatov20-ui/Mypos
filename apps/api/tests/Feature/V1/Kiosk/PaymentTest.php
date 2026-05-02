<?php

declare(strict_types=1);

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Tenant\Models\Tenant;

it('creates a cash payment intent for an own order', function (): void {
    $tenant = Tenant::factory()->create();
    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $paired['device']->id,
        'total_amount' => 50000,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/payment-intent', [
            'order_id' => $order->id,
            'provider' => PaymentProvider::Cash->value,
        ])
        ->assertCreated()
        ->assertJsonPath('data.payment.provider', PaymentProvider::Cash->value)
        ->assertJsonPath('data.payment.status', PaymentStatus::Pending->value)
        ->assertJsonPath('data.payment.amount', 50000)
        ->assertJsonPath('data.payment_url', null);

    expect(Payment::query()->withoutGlobalScopes()->count())->toBe(1);
});

it('captures a cash payment for an own order', function (): void {
    $tenant = Tenant::factory()->create();
    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $paired['device']->id,
        'total_amount' => 30000,
    ]);

    $payment = Payment::query()->create([
        'tenant_id' => $tenant->id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Cash->value,
        'amount' => 30000,
        'currency' => 'UZS',
        'status' => PaymentStatus::Pending->value,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson("/api/v1/kiosk/payment-intent/{$payment->id}/capture")
        ->assertOk()
        ->assertJsonPath('data.status', PaymentStatus::Captured->value);
});

it('refuses to create payment for an order owned by another device', function (): void {
    $tenant = Tenant::factory()->create();
    $deviceA = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);
    $deviceB = KioskDevice::factory()->create(['tenant_id' => $tenant->id]);

    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $deviceB->id,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $deviceA['token'])
        ->postJson('/api/v1/kiosk/payment-intent', [
            'order_id' => $order->id,
            'provider' => PaymentProvider::Cash->value,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['order_id']);
});

it('refuses to capture payment for an order owned by another device', function (): void {
    $tenant = Tenant::factory()->create();
    $deviceA = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);
    $deviceB = KioskDevice::factory()->create(['tenant_id' => $tenant->id]);

    $orderForB = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $deviceB->id,
    ]);

    $payment = Payment::query()->create([
        'tenant_id' => $tenant->id,
        'order_id' => $orderForB->id,
        'provider' => PaymentProvider::Cash->value,
        'amount' => 1000,
        'currency' => 'UZS',
        'status' => PaymentStatus::Pending->value,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $deviceA['token'])
        ->postJson("/api/v1/kiosk/payment-intent/{$payment->id}/capture")
        ->assertNotFound();
});

it('rejects a non-allowed provider', function (): void {
    $tenant = Tenant::factory()->create();
    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'kiosk_device_id' => $paired['device']->id,
    ]);

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/payment-intent', [
            'order_id' => $order->id,
            'provider' => 'uzum',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['provider']);
});
