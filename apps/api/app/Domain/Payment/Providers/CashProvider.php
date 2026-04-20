<?php

declare(strict_types=1);

namespace App\Domain\Payment\Providers;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Cash payment — no gateway, no webhook. Captured manually by a manager.
 */
class CashProvider implements PaymentProviderInterface
{
    public function key(): string
    {
        return PaymentProvider::Cash->value;
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array{payment_url: string|null, transaction_id: string|null}
     */
    public function createIntent(Order $order, array $options = []): array
    {
        return [
            'payment_url' => null,
            'transaction_id' => null,
        ];
    }

    public function verifyWebhook(Request $request): bool
    {
        // Cash has no webhook.
        return false;
    }

    public function handleWebhook(Request $request): Payment
    {
        throw new RuntimeException('Cash provider does not support webhooks.');
    }

    public function refund(Payment $payment, int $amountMinor): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Refunded->value,
            'refunded_at' => now(),
        ]);

        return $payment->fresh() ?? $payment;
    }
}
