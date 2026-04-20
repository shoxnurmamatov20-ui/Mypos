<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Table\Models\TableCategory;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<TableCategory> */
class TableCategoryFactory extends Factory
{
    protected $model = TableCategory::class;

    public function definition(): array
    {
        $names = ['Zal', 'Terassa', 'VIP', 'Oila'];
        $pick = fake()->randomElement($names);

        return [
            'tenant_id' => Tenant::factory(),
            'name' => ['uz' => $pick, 'ru' => $pick, 'en' => $pick],
            'slug' => Str::slug($pick) . '-' . Str::random(4),
            'sort_order' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
