<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoMenuSeeder extends Seeder
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
            $this->command?->warn('Demo tenant not found; skipping menu seed.');
            return;
        }

        DB::transaction(function () use ($tenant): void {
            $categories = [
                'national' => [
                    'name' => ['uz' => 'Milliy taomlar', 'ru' => 'Национальные блюда', 'en' => 'National dishes'],
                    'slug' => 'national',
                    'icon' => 'utensils', 'color' => '#EA7C69', 'sort_order' => 1,
                ],
                'salads' => [
                    'name' => ['uz' => 'Salatlar', 'ru' => 'Салаты', 'en' => 'Salads'],
                    'slug' => 'salads',
                    'icon' => 'salad', 'color' => '#50D1AA', 'sort_order' => 2,
                ],
                'fast-food' => [
                    'name' => ['uz' => 'Fast Food', 'ru' => 'Фаст-фуд', 'en' => 'Fast Food'],
                    'slug' => 'fast-food',
                    'icon' => 'burger', 'color' => '#F59E0B', 'sort_order' => 3,
                ],
                'drinks' => [
                    'name' => ['uz' => 'Ichimliklar', 'ru' => 'Напитки', 'en' => 'Drinks'],
                    'slug' => 'drinks',
                    'icon' => 'coffee', 'color' => '#3B82F6', 'sort_order' => 4,
                ],
                'desserts' => [
                    'name' => ['uz' => 'Desertlar', 'ru' => 'Десерты', 'en' => 'Desserts'],
                    'slug' => 'desserts',
                    'icon' => 'cake', 'color' => '#8B5CF6', 'sort_order' => 5,
                ],
            ];

            $catModels = [];
            foreach ($categories as $key => $catData) {
                $catModels[$key] = MenuCategory::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'slug' => $catData['slug']],
                    [
                        'name' => $catData['name'],
                        'icon' => $catData['icon'],
                        'color' => $catData['color'],
                        'sort_order' => $catData['sort_order'],
                        'is_active' => true,
                    ],
                );
            }

            $items = [
                ['national', 'Osh', 'Плов', 'Plov', 25000, 'Klassik o\'zbek oshi', true, false],
                ['national', 'Lag\'mon', 'Лагман', 'Lagman', 28000, 'Qo\'lda tortilgan lag\'mon', false, false],
                ['national', 'Shashlik qo\'y', 'Шашлык из баранины', 'Lamb Kebab', 35000, 'Mazali qo\'y go\'shti', false, true],
                ['national', 'Shashlik mol', 'Шашлык из говядины', 'Beef Kebab', 32000, null, false, false],
                ['national', 'Manti (5 dona)', 'Манты (5 шт)', 'Manti (5 pc)', 22000, 'Qo\'y go\'shti bilan', false, false],
                ['national', 'Samsa tandir', 'Самса тандыр', 'Tandir Samsa', 8000, null, true, false],
                ['national', 'Norin', 'Норин', 'Norin', 30000, 'Otga oshpaz tayyorlagan', false, false],
                ['national', 'Mastava', 'Мастава', 'Mastava', 18000, null, false, false],

                ['salads', 'Achchiq-chuchuk', 'Ачик-чучук', 'Achchiq-chuchuk', 15000, 'Pomidor + piyoz + bodring', false, false],
                ['salads', 'Sezar tovuq', 'Цезарь с курицей', 'Chicken Caesar', 28000, null, false, false],
                ['salads', 'Mayonezli salat', 'Салат с майонезом', 'Mayo Salad', 20000, null, false, false],
                ['salads', 'Grek salat', 'Греческий салат', 'Greek Salad', 25000, 'Brynza + zaytun + bulg\'or', true, false],

                ['fast-food', 'Classic Burger', 'Классический Бургер', 'Classic Burger', 38000, null, false, true],
                ['fast-food', 'Cheeseburger', 'Чизбургер', 'Cheeseburger', 42000, null, false, false],
                ['fast-food', 'Hot-dog', 'Хот-дог', 'Hot Dog', 22000, null, false, false],
                ['fast-food', 'Shaurma', 'Шаурма', 'Shawarma', 25000, 'Lavashli, achchiq sous bilan', false, false],
                ['fast-food', 'Pitsa Margarita', 'Пицца Маргарита', 'Margherita Pizza', 55000, null, false, false],
                ['fast-food', 'Pepperoni pitsa', 'Пицца Пепперони', 'Pepperoni Pizza', 68000, null, true, false],

                ['drinks', 'Ko\'k choy', 'Зеленый чай', 'Green Tea', 5000, null, false, false],
                ['drinks', 'Qora choy', 'Черный чай', 'Black Tea', 5000, null, false, false],
                ['drinks', 'Coca-Cola 0.5L', 'Кока-Кола 0.5L', 'Coca-Cola 0.5L', 12000, null, false, false],
                ['drinks', 'Fanta 0.5L', 'Фанта 0.5L', 'Fanta 0.5L', 12000, null, false, false],
                ['drinks', 'Suv 0.5L', 'Вода 0.5L', 'Water 0.5L', 6000, null, false, false],
                ['drinks', 'Espresso', 'Эспрессо', 'Espresso', 15000, null, false, false],
                ['drinks', 'Cappuccino', 'Капучино', 'Cappuccino', 22000, null, false, false],
                ['drinks', 'Smuti', 'Смузи', 'Smoothie', 28000, 'Mevali smuti', true, false],

                ['desserts', 'Choy bilan halva', 'Халва к чаю', 'Halwa w/Tea', 12000, null, false, false],
                ['desserts', 'Tiramisu', 'Тирамису', 'Tiramisu', 32000, null, false, false],
                ['desserts', 'Cheesecake', 'Чизкейк', 'Cheesecake', 28000, null, false, false],
                ['desserts', 'Muzqaymoq', 'Мороженое', 'Ice Cream', 15000, null, false, false],
            ];

            foreach ($items as $i => [$catSlug, $uz, $ru, $en, $price, $descUz, $isNew, $isFeatured]) {
                $category = $catModels[$catSlug];
                MenuItem::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'slug' => Str::slug($en)],
                    [
                        'category_id' => $category->id,
                        'name' => ['uz' => $uz, 'ru' => $ru, 'en' => $en],
                        'description' => $descUz !== null ? [
                            'uz' => $descUz,
                            'ru' => $descUz,
                            'en' => $descUz,
                        ] : null,
                        'price_amount' => $price,
                        'price_currency' => 'UZS',
                        'is_active' => true,
                        'is_new' => $isNew,
                        'is_featured' => $isFeatured,
                        'sort_order' => $i,
                    ],
                );
            }

            $this->command?->info('Seeded ' . count($categories) . ' categories and ' . count($items) . ' menu items.');
        });
    }
}
