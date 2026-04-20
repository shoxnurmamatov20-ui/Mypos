<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\PaymentManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreatePaymentIntentAction
{
    public function __construct(private PaymentManager $manager)
    {
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array{payment: Payment, payment_url: string|null, transaction_id: string|null}
     */
    public function __invoke(Order $order, PaymentProvider $provider, array $options = []): array
    {
        return DB::transaction(function () use ($order, $provider, $options): array {
            $driver = $this->manager->driver($provider);

            $payment = Payment::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'provider' => $provider->value,
                'amount' => $order->total_amount,
                'currency' => $order->currency,
                'status' => PaymentStatus::Pending->value,
                'idempotency_key' => (string) Str::uuid(),
            ]);

            $intent = $driver->createIntent($order, $options);

            if (! empty($intent['transaction_id'])) {
                $payment->update(['provider_transaction_id' => $intent['transaction_id']]);
            }

            return [
                'payment' => $payment->fresh() ?? $payment,
                'payment_url' => $intent['payment_url'] ?? null,
                'transaction_id' => $intent['transaction_id'] ?? null,
            ];
        });
    }
}
