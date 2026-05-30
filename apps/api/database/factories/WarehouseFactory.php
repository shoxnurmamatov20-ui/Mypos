<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Warehouse\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Warehouse> */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->randomElement(['Asosiy ombor', 'Yordamchi ombor', 'Sovutgich', 'Quruq ombor']),
            'address' => fake()->streetAddress(),
            'is_active' => true,
            'is_default' => false,
            'sort_order' => fake()->numberBetween(0, 50),
            'notes' => null,
        ];
    }

    public function default(): static
    {
        return $this->state(fn () => ['is_default' => true, 'name' => 'Asosiy ombor']);
    }
}
