<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OrderItem> */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $price = fake()->numberBetween(15_000, 100_000);
        $qty = fake()->numberBetween(1, 5);

        return [
            'tenant_id' => Tenant::factory(),
            'order_id' => Order::factory(),
            'menu_item_id' => MenuItem::factory(),
            'name_snapshot' => fake()->randomElement(['Osh', 'Shashlik', 'Manti']),
            'price_amount' => $price,
            'quantity' => $qty,
            'subtotal_amount' => $price * $qty,
            'currency' => 'UZS',
            'status' => 'pending',
        ];
    }
}
