<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<MenuItem> */
class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    public function definition(): array
    {
        $names = ['Osh', 'Shashlik', 'Manti', 'Lag\'mon', 'Samsa', 'Norin', 'Chuchvara', 'Somsa'];
        $pick = fake()->randomElement($names);

        return [
            'category_id' => MenuCategory::factory(),
            'name' => ['uz' => $pick, 'ru' => $pick, 'en' => $pick],
            'description' => [
                'uz' => "Mazali $pick",
                'ru' => "Вкусный $pick",
                'en' => "Tasty $pick",
            ],
            'slug' => Str::slug($pick).'-'.Str::random(4),
            'sku' => strtoupper(Str::random(8)),
            'price_amount' => fake()->numberBetween(15_000, 150_000),
            'price_currency' => 'UZS',
            'cost_amount' => fake()->numberBetween(5_000, 50_000),
            'allergens' => fake()->randomElements(['gluten', 'dairy', 'nuts', 'egg'], 2),
            'tags' => fake()->randomElements(['new', 'spicy', 'vegetarian', 'popular'], 1),
            'calories' => fake()->numberBetween(100, 1200),
            'preparation_minutes' => fake()->numberBetween(5, 45),
            'is_active' => true,
            'is_featured' => fake()->boolean(20),
            'is_new' => fake()->boolean(15),
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    /**
     * Pin the item AND its nested category to a tenant — without this the
     * implicit `MenuCategory::factory()` in definition() would try to create
     * a category with a NULL tenant_id and hit the NOT NULL constraint.
     */
    public function forTenant(Tenant $tenant): static
    {
        return $this->state(fn (): array => [
            'tenant_id' => $tenant->id,
            'category_id' => MenuCategory::factory()->forTenant($tenant),
        ]);
    }
}
