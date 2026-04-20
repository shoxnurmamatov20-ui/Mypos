<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Providers\ClickProvider;

beforeEach(function (): void {
    config()->set('services.click.service_id', '100');
    config()->set('services.click.merchant_id', '200');
    config()->set('services.click.secret_key', 'secret_xyz');
});

function clickSignature(
    string $clickTransId,
    string $serviceId,
    string $secret,
    string $merchantTransId,
    string $amount,
    int $action,
    string $signTime,
    string $merchantPrepareId = '',
): string {
    $parts = [$clickTransId, $serviceId, $secret, $merchantTransId];
    if ($action === ClickProvider::ACTION_COMPLETE) {
        $parts[] = $merchantPrepareId;
    }
    $parts[] = $amount;
    $parts[] = (string) $action;
    $parts[] = $signTime;

    return md5(implode('', $parts));
}

it('rejects an invalid signature', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'CLK-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'deadbeef',
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SIGN_CHECK);

    expect(Payment::query()->count())->toBe(0);
});

it('handles prepare action and creates an authorized payment', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $signTime = '2026-04-20 12:00:00';
    $sig = clickSignature('777', '100', 'secret_xyz', $order->id, '50000', ClickProvider::ACTION_PREPARE, $signTime);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => '777',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => $signTime,
        'sign_string' => $sig,
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SUCCESS);

    $payment = Payment::withoutGlobalScopes()->firstWhere('provider_transaction_id', '777');
    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe(PaymentStatus::Authorized->value);
});

it('handles complete action and captures the payment', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 50000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);

    // PREPARE
    $signTime = '2026-04-20 12:00:00';
    $prepSig = clickSignature('888', '100', 'secret_xyz', $order->id, '50000', ClickProvider::ACTION_PREPARE, $signTime);
    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => '888',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => $signTime,
        'sign_string' => $prepSig,
    ])->assertOk();

    // COMPLETE
    $completeSig = clickSignature('888', '100', 'secret_xyz', $order->id, '50000', ClickProvider::ACTION_COMPLETE, $signTime, '42');
    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => '888',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'merchant_prepare_id' => '42',
        'amount' => 50000,
        'action' => ClickProvider::ACTION_COMPLETE,
        'error' => 0,
        'sign_time' => $signTime,
        'sign_string' => $completeSig,
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SUCCESS);

    $payment = Payment::withoutGlobalScopes()->firstWhere('provider_transaction_id', '888');
    expect($payment->status)->toBe(PaymentStatus::Captured->value);

    $order->refresh();
    expect($order->payment_status)->toBe('paid');
    expect($order->paid_amount)->toBe(50000);
});

it('is idempotent for the same click_trans_id', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $signTime = '2026-04-20 12:00:00';
    $sig = clickSignature('999', '100', 'secret_xyz', $order->id, '50000', ClickProvider::ACTION_PREPARE, $signTime);

    $payload = [
        'click_trans_id' => '999',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => $signTime,
        'sign_string' => $sig,
    ];

    $this->postJson('/api/v1/webhooks/click', $payload)->assertOk();
    $this->postJson('/api/v1/webhooks/click', $payload)->assertOk();

    expect(Payment::withoutGlobalScopes()->where('provider_transaction_id', '999')->count())->toBe(1);
});

it('accepts stub mode when secret_key is empty', function (): void {
    config()->set('services.click.secret_key', '');

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 25000]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'STUB-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 25000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SUCCESS);
});
