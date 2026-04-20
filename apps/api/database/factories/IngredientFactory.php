<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Ingredient> */
class IngredientFactory extends Factory
{
    protected $model = Ingredient::class;

    public function definition(): array
    {
        /** @var array<int, array{uz: string, ru: string, en: string, unit: string, cost: int}> $pool */
        $pool = [
            ['uz' => 'Pomidor', 'ru' => 'Помидор', 'en' => 'Tomato', 'unit' => 'kg', 'cost' => 12000],
            ['uz' => 'Piyoz', 'ru' => 'Лук', 'en' => 'Onion', 'unit' => 'kg', 'cost' => 6000],
            ['uz' => 'Kartoshka', 'ru' => 'Картошка', 'en' => 'Potato', 'unit' => 'kg', 'cost' => 5000],
            ['uz' => 'Sabzi', 'ru' => 'Морковь', 'en' => 'Carrot', 'unit' => 'kg', 'cost' => 6500],
            ['uz' => 'Bodring', 'ru' => 'Огурец', 'en' => 'Cucumber', 'unit' => 'kg', 'cost' => 14000],
            ['uz' => 'Tuxum', 'ru' => 'Яйцо', 'en' => 'Egg', 'unit' => 'piece', 'cost' => 1500],
            ['uz' => 'Pishloq', 'ru' => 'Сыр', 'en' => 'Cheese', 'unit' => 'kg', 'cost' => 95000],
            ['uz' => 'Brynza', 'ru' => 'Брынза', 'en' => 'Brynza', 'unit' => 'kg', 'cost' => 70000],
            ['uz' => 'Un', 'ru' => 'Мука', 'en' => 'Flour', 'unit' => 'kg', 'cost' => 7000],
            ['uz' => 'Guruch', 'ru' => 'Рис', 'en' => 'Rice', 'unit' => 'kg', 'cost' => 14000],
            ['uz' => 'Qo\'y go\'shti', 'ru' => 'Баранина', 'en' => 'Lamb', 'unit' => 'kg', 'cost' => 120000],
            ['uz' => 'Mol go\'shti', 'ru' => 'Говядина', 'en' => 'Beef', 'unit' => 'kg', 'cost' => 110000],
            ['uz' => 'Tovuq filesi', 'ru' => 'Куриное филе', 'en' => 'Chicken fillet', 'unit' => 'kg', 'cost' => 65000],
            ['uz' => 'O\'simlik yog\'i', 'ru' => 'Растительное масло', 'en' => 'Vegetable oil', 'unit' => 'L', 'cost' => 22000],
            ['uz' => 'Zira', 'ru' => 'Зира', 'en' => 'Cumin', 'unit' => 'kg', 'cost' => 60000],
            ['uz' => 'Tuz', 'ru' => 'Соль', 'en' => 'Salt', 'unit' => 'kg', 'cost' => 2500],
            ['uz' => 'Shakar', 'ru' => 'Сахар', 'en' => 'Sugar', 'unit' => 'kg', 'cost' => 9500],
            ['uz' => 'Sut', 'ru' => 'Молоко', 'en' => 'Milk', 'unit' => 'L', 'cost' => 11000],
            ['uz' => 'Smetana', 'ru' => 'Сметана', 'en' => 'Sour cream', 'unit' => 'kg', 'cost' => 32000],
            ['uz' => 'Qaynoq non', 'ru' => 'Лаваш', 'en' => 'Lavash', 'unit' => 'piece', 'cost' => 4000],
            ['uz' => 'Coca-Cola 0.5L', 'ru' => 'Кока-Кола 0.5L', 'en' => 'Coca-Cola 0.5L', 'unit' => 'piece', 'cost' => 8000],
            ['uz' => 'Suv 0.5L', 'ru' => 'Вода 0.5L', 'en' => 'Water 0.5L', 'unit' => 'piece', 'cost' => 3000],
            ['uz' => 'Qora choy', 'ru' => 'Чёрный чай', 'en' => 'Black tea', 'unit' => 'kg', 'cost' => 85000],
            ['uz' => 'Ko\'k choy', 'ru' => 'Зелёный чай', 'en' => 'Green tea', 'unit' => 'kg', 'cost' => 80000],
        ];

        $pick = fake()->randomElement($pool);

        return [
            'name' => ['uz' => $pick['uz'], 'ru' => $pick['ru'], 'en' => $pick['en']],
            'sku' => strtoupper('ING-' . Str::random(6)),
            'unit' => $pick['unit'],
            'cost_per_unit' => $pick['cost'],
            'current_stock' => fake()->numberBetween(5, 100),
            'min_stock' => fake()->numberBetween(2, 10),
            'reorder_point' => fake()->numberBetween(5, 20),
            'is_active' => true,
        ];
    }
}
