<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'order_no' => 'O' . now()->format('ymd') . '-' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'type' => 'dine_in',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'table_id' => null,
            'employee_id' => null,
            'guest_count' => fake()->numberBetween(1, 6),
            'subtotal_amount' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'tip_amount' => 0,
            'service_charge_amount' => 0,
            'total_amount' => 0,
            'paid_amount' => 0,
            'currency' => 'UZS',
            'placed_at' => now(),
        ];
    }
}
