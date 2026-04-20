<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Table\Models\Table;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Table> */
class TableFactory extends Factory
{
    protected $model = Table::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'category_id' => null,
            'name' => 'T-' . fake()->unique()->numberBetween(1, 9999),
            'capacity' => fake()->numberBetween(2, 10),
            'status' => 'available',
            'shape' => fake()->randomElement(['round', 'square', 'rectangle']),
            'position_x' => fake()->numberBetween(0, 1000),
            'position_y' => fake()->numberBetween(0, 1000),
            'width' => 100,
            'height' => 100,
            'qr_code' => strtoupper(Str::random(12)),
        ];
    }
}
