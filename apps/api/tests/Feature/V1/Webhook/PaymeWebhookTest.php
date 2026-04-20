<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Providers\PaymeProvider;

beforeEach(function (): void {
    config()->set('services.payme.merchant_id', 'merchant-xyz');
    config()->set('services.payme.secret_key', 'secret-xyz');
});

function paymeAuthHeader(string $key = 'secret-xyz'): string
{
    return 'Basic ' . base64_encode('Paycom:' . $key);
}

it('rejects requests with invalid Basic auth', function (): void {
    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 10000, 'account' => ['order_id' => 'nope']],
    ], [
        'Authorization' => paymeAuthHeader('wrong-key'),
    ])
        ->assertOk()
        ->assertJsonPath('error.code', PaymeProvider::ERR_INVALID_AUTH);
});

it('responds to CheckPerformTransaction with allow=true for a valid order', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 20000,
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 20000, 'account' => ['order_id' => $order->id]],
    ], [
        'Authorization' => paymeAuthHeader(),
    ])
        ->assertOk()
        ->assertJsonPath('result.allow', true);
});

it('returns an error on CheckPerformTransaction when amount does not match', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 20000,
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 99999, 'account' => ['order_id' => $order->id]],
    ], [
        'Authorization' => paymeAuthHeader(),
    ])
        ->assertOk()
        ->assertJsonPath('error.code', PaymeProvider::ERR_ORDER_NOT_FOUND);
});

it('creates a transaction on CreateTransaction', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 20000,
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 2,
        'method' => 'CreateTransaction',
        'params' => [
            'id' => 'PAYME-TX-1',
            'time' => now()->valueOf(),
            'amount' => 20000,
            'account' => ['order_id' => $order->id],
        ],
    ], [
        'Authorization' => paymeAuthHeader(),
    ])
        ->assertOk()
        ->assertJsonPath('result.state', PaymeProvider::STATE_CREATED);

    $payment = Payment::withoutGlobalScopes()->firstWhere('provider_transaction_id', 'PAYME-TX-1');
    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe(PaymentStatus::Authorized->value);
});

it('completes a transaction on PerformTransaction', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 15000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);

    Payment::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Payme->value,
        'provider_transaction_id' => 'PAYME-TX-2',
        'amount' => 15000,
        'status' => PaymentStatus::Authorized->value,
        'authorized_at' => now(),
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 3,
        'method' => 'PerformTransaction',
        'params' => ['id' => 'PAYME-TX-2'],
    ], [
        'Authorization' => paymeAuthHeader(),
    ])
        ->assertOk()
        ->assertJsonPath('result.state', PaymeProvider::STATE_COMPLETED);

    $payment = Payment::withoutGlobalScopes()->firstWhere('provider_transaction_id', 'PAYME-TX-2');
    expect($payment->status)->toBe(PaymentStatus::Captured->value);

    $order->refresh();
    expect($order->payment_status)->toBe('paid');
    expect($order->paid_amount)->toBe(15000);
});

it('cancels a created transaction on CancelTransaction', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 12000]);

    Payment::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Payme->value,
        'provider_transaction_id' => 'PAYME-TX-3',
        'amount' => 12000,
        'status' => PaymentStatus::Authorized->value,
        'authorized_at' => now(),
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 4,
        'method' => 'CancelTransaction',
        'params' => ['id' => 'PAYME-TX-3', 'reason' => 3],
    ], [
        'Authorization' => paymeAuthHeader(),
    ])
        ->assertOk()
        ->assertJsonPath('result.state', PaymeProvider::STATE_CANCELLED_AFTER_CREATE);

    $payment = Payment::withoutGlobalScopes()->firstWhere('provider_transaction_id', 'PAYME-TX-3');
    expect($payment->status)->toBe(PaymentStatus::Cancelled->value);
});

it('returns transaction info on CheckTransaction', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 8000]);

    Payment::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Payme->value,
        'provider_transaction_id' => 'PAYME-TX-4',
        'amount' => 8000,
        'status' => PaymentStatus::Captured->value,
        'authorized_at' => now()->subMinute(),
        'captured_at' => now(),
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 5,
        'method' => 'CheckTransaction',
        'params' => ['id' => 'PAYME-TX-4'],
    ], [
        'Authorization' => paymeAuthHeader(),
    ])
        ->assertOk()
        ->assertJsonPath('result.state', PaymeProvider::STATE_COMPLETED);
});

it('is idempotent for CreateTransaction', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 20000]);

    $payload = [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CreateTransaction',
        'params' => [
            'id' => 'PAYME-TX-5',
            'time' => now()->valueOf(),
            'amount' => 20000,
            'account' => ['order_id' => $order->id],
        ],
    ];
    $headers = ['Authorization' => paymeAuthHeader()];

    $this->postJson('/api/v1/webhooks/payme', $payload, $headers)->assertOk();
    $this->postJson('/api/v1/webhooks/payme', $payload, $headers)->assertOk();

    expect(Payment::withoutGlobalScopes()->where('provider_transaction_id', 'PAYME-TX-5')->count())->toBe(1);
});
