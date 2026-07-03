<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<MenuCategory> */
class MenuCategoryFactory extends Factory
{
    protected $model = MenuCategory::class;

    public function definition(): array
    {
        $names = ['Salatlar', 'Milliy taomlar', 'Ichimliklar', 'Desertlar', 'Fast Food'];
        $pick = fake()->randomElement($names);

        return [
            'name' => ['uz' => $pick, 'ru' => $pick, 'en' => $pick],
            'slug' => Str::slug($pick).'-'.Str::random(4),
            'icon' => fake()->randomElement(['utensils', 'coffee', 'pizza', 'salad', 'ice-cream']),
            'color' => fake()->hexColor(),
            'sort_order' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }

    /** Pin the category (explicitly, not via factory magic) to a tenant. */
    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
