<?php

declare(strict_types=1);

namespace App\Domain\Payment\Providers;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;

interface PaymentProviderInterface
{
    /**
     * Create a payment intent for an order.
     *
     * @param  array<string, mixed>  $options
     * @return array{payment_url: string|null, transaction_id: string|null, provider_response?: array<string, mixed>}
     */
    public function createIntent(Order $order, array $options = []): array;

    /**
     * Verify an incoming webhook request (signature/auth).
     */
    public function verifyWebhook(Request $request): bool;

    /**
     * Handle an incoming webhook and return the reflected Payment.
     */
    public function handleWebhook(Request $request): Payment;

    /**
     * Issue a refund. Amount is in minor units (so'm for UZS).
     */
    public function refund(Payment $payment, int $amountMinor): Payment;

    /**
     * Unique provider key (matches PaymentProvider enum value).
     */
    public function key(): string;
}
