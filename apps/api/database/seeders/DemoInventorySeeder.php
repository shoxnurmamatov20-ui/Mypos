<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\IngredientCategory;
use App\Domain\Inventory\Models\Recipe;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoInventorySeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn(static::class . ' refused to run outside local/testing environments.');
            return;
        }

        // Demo seeders run from artisan (no Auth user). Opt-in to lenient
        // BelongsToTenant scope so existing-row lookups behave as before.
        BelongsToTenant::allowEmptyTenantContext();

        $tenant = Tenant::where('slug', 'demo-restaurant')->first();
        if ($tenant === null) {
            $this->command?->warn('Demo tenant not found; skipping inventory seed.');
            return;
        }

        DB::transaction(function () use ($tenant): void {
            // 1) Ingredient categories
            $categories = [
                'produce' => ['uz' => 'Sabzavot va ko\'kat', 'ru' => 'Овощи и зелень', 'en' => 'Produce'],
                'meat' => ['uz' => 'Go\'sht', 'ru' => 'Мясо', 'en' => 'Meat'],
                'dairy' => ['uz' => 'Sut mahsulotlari', 'ru' => 'Молочные', 'en' => 'Dairy'],
                'pantry' => ['uz' => 'Oshxona', 'ru' => 'Бакалея', 'en' => 'Pantry'],
                'beverages' => ['uz' => 'Ichimliklar', 'ru' => 'Напитки', 'en' => 'Beverages'],
            ];

            $catIds = [];
            $sortIdx = 0;
            foreach ($categories as $key => $name) {
                $category = IngredientCategory::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('name->uz', $name['uz'])
                    ->first();
                if ($category === null) {
                    $category = IngredientCategory::create([
                        'tenant_id' => $tenant->id,
                        'name' => $name,
                        'sort_order' => ++$sortIdx,
                    ]);
                }
                $catIds[$key] = $category->id;
            }

            // 2) Ingredients
            $ingredients = [
                ['produce', 'Pomidor', 'Помидор', 'Tomato', 'kg', 12000, 25, 5],
                ['produce', 'Piyoz', 'Лук', 'Onion', 'kg', 6000, 30, 5],
                ['produce', 'Kartoshka', 'Картошка', 'Potato', 'kg', 5000, 40, 10],
                ['produce', 'Sabzi', 'Морковь', 'Carrot', 'kg', 6500, 20, 4],
                ['produce', 'Bodring', 'Огурец', 'Cucumber', 'kg', 14000, 15, 3],
                ['produce', 'Salat bargi', 'Салат', 'Lettuce', 'kg', 18000, 4, 2],
                ['meat', 'Qo\'y go\'shti', 'Баранина', 'Lamb', 'kg', 120000, 12, 3],
                ['meat', 'Mol go\'shti', 'Говядина', 'Beef', 'kg', 110000, 10, 3],
                ['meat', 'Tovuq filesi', 'Куриное филе', 'Chicken fillet', 'kg', 65000, 8, 2],
                ['dairy', 'Pishloq', 'Сыр', 'Cheese', 'kg', 95000, 5, 1],
                ['dairy', 'Brynza', 'Брынза', 'Brynza', 'kg', 70000, 3, 1],
                ['dairy', 'Sut', 'Молоко', 'Milk', 'L', 11000, 20, 5],
                ['dairy', 'Smetana', 'Сметана', 'Sour cream', 'kg', 32000, 4, 1],
                ['dairy', 'Tuxum', 'Яйцо', 'Egg', 'piece', 1500, 200, 30],
                ['pantry', 'Un', 'Мука', 'Flour', 'kg', 7000, 50, 10],
                ['pantry', 'Guruch', 'Рис', 'Rice', 'kg', 14000, 40, 8],
                ['pantry', 'O\'simlik yog\'i', 'Растительное масло', 'Vegetable oil', 'L', 22000, 25, 5],
                ['pantry', 'Tuz', 'Соль', 'Salt', 'kg', 2500, 8, 1],
                ['pantry', 'Zira', 'Зира', 'Cumin', 'kg', 60000, 1.5, 0.3],
                ['beverages', 'Coca-Cola 0.5L', 'Кока-Кола 0.5L', 'Coca-Cola 0.5L', 'piece', 8000, 60, 12],
                ['beverages', 'Suv 0.5L', 'Вода 0.5L', 'Water 0.5L', 'piece', 3000, 80, 15],
                ['beverages', 'Qora choy', 'Чёрный чай', 'Black tea', 'kg', 85000, 2, 0.3],
                ['beverages', 'Ko\'k choy', 'Зелёный чай', 'Green tea', 'kg', 80000, 2, 0.3],
            ];

            $ingredientByEn = [];
            foreach ($ingredients as [$catKey, $uz, $ru, $en, $unit, $cost, $currentStock, $minStock]) {
                $ing = Ingredient::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('name->en', $en)
                    ->first();
                if ($ing === null) {
                    $ing = Ingredient::create([
                        'tenant_id' => $tenant->id,
                        'category_id' => $catIds[$catKey],
                        'name' => ['uz' => $uz, 'ru' => $ru, 'en' => $en],
                        'sku' => strtoupper('ING-' . Str::slug($en, '_')),
                        'unit' => $unit,
                        'cost_per_unit' => $cost,
                        'current_stock' => $currentStock,
                        'min_stock' => $minStock,
                        'reorder_point' => $minStock * 2,
                        'is_active' => true,
                    ]);
                }
                $ingredientByEn[$en] = $ing;
            }

            // 3) Recipes for 10 menu items (linked by their English slug prefix)
            $recipesByMenu = [
                'plov' => [
                    ['Rice', 0.25, 'kg'],
                    ['Lamb', 0.15, 'kg'],
                    ['Onion', 0.08, 'kg'],
                    ['Carrot', 0.12, 'kg'],
                    ['Vegetable oil', 0.05, 'L'],
                    ['Salt', 0.005, 'kg'],
                    ['Cumin', 0.002, 'kg'],
                ],
                'lagman' => [
                    ['Flour', 0.15, 'kg'],
                    ['Beef', 0.12, 'kg'],
                    ['Onion', 0.05, 'kg'],
                    ['Carrot', 0.05, 'kg'],
                    ['Tomato', 0.08, 'kg'],
                ],
                'lamb-kebab' => [
                    ['Lamb', 0.25, 'kg'],
                    ['Onion', 0.03, 'kg'],
                    ['Salt', 0.003, 'kg'],
                ],
                'beef-kebab' => [
                    ['Beef', 0.25, 'kg'],
                    ['Onion', 0.03, 'kg'],
                    ['Salt', 0.003, 'kg'],
                ],
                'achchiq-chuchuk' => [
                    ['Tomato', 0.15, 'kg'],
                    ['Onion', 0.05, 'kg'],
                    ['Cucumber', 0.08, 'kg'],
                ],
                'chicken-caesar' => [
                    ['Chicken fillet', 0.15, 'kg'],
                    ['Lettuce', 0.08, 'kg'],
                    ['Cheese', 0.03, 'kg'],
                ],
                'classic-burger' => [
                    ['Beef', 0.18, 'kg'],
                    ['Cheese', 0.03, 'kg'],
                    ['Tomato', 0.03, 'kg'],
                    ['Lettuce', 0.03, 'kg'],
                ],
                'cheeseburger' => [
                    ['Beef', 0.18, 'kg'],
                    ['Cheese', 0.05, 'kg'],
                    ['Tomato', 0.03, 'kg'],
                ],
                'margherita-pizza' => [
                    ['Flour', 0.22, 'kg'],
                    ['Cheese', 0.12, 'kg'],
                    ['Tomato', 0.10, 'kg'],
                ],
                'coca-cola-0-5l' => [
                    ['Coca-Cola 0.5L', 1, 'piece'],
                ],
                'water-0-5l' => [
                    ['Water 0.5L', 1, 'piece'],
                ],
                'black-tea' => [
                    ['Black tea', 0.005, 'kg'],
                ],
                'green-tea' => [
                    ['Green tea', 0.005, 'kg'],
                ],
            ];

            $recipeCount = 0;
            foreach ($recipesByMenu as $slug => $entries) {
                $menuItem = MenuItem::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('slug', $slug)
                    ->first();
                if ($menuItem === null) {
                    continue;
                }
                foreach ($entries as [$en, $qty, $unit]) {
                    if (! isset($ingredientByEn[$en])) {
                        continue;
                    }
                    Recipe::firstOrCreate(
                        [
                            'menu_item_id' => $menuItem->id,
                            'ingredient_id' => $ingredientByEn[$en]->id,
                        ],
                        [
                            'tenant_id' => $tenant->id,
                            'quantity' => $qty,
                            'unit' => $unit,
                            'is_optional' => false,
                        ],
                    );
                    $recipeCount++;
                }
            }

            $this->command?->info('Seeded ' . count($catIds) . ' ingredient categories, '
                . count($ingredientByEn) . ' ingredients, ' . $recipeCount . ' recipes.');
        });
    }
}
