<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Payment> */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'order_id' => Order::factory(),
            'provider' => fake()->randomElement(PaymentProvider::values()),
            'provider_transaction_id' => null,
            'amount' => fake()->numberBetween(10_000, 500_000),
            'currency' => 'UZS',
            'status' => PaymentStatus::Pending->value,
            'failure_reason' => null,
            'raw_request' => null,
            'raw_response' => null,
            'idempotency_key' => (string) Str::uuid(),
            'authorized_at' => null,
            'captured_at' => null,
            'refunded_at' => null,
            'failed_at' => null,
        ];
    }

    public function captured(): self
    {
        return $this->state(fn (): array => [
            'status' => PaymentStatus::Captured->value,
            'captured_at' => now(),
        ]);
    }

    public function pending(): self
    {
        return $this->state(fn (): array => [
            'status' => PaymentStatus::Pending->value,
        ]);
    }

    public function forProvider(PaymentProvider $provider): self
    {
        return $this->state(fn (): array => [
            'provider' => $provider->value,
        ]);
    }
}
