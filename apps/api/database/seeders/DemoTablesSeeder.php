<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Table\Models\Table;
use App\Domain\Table\Models\TableCategory;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoTablesSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo-restaurant')->first();
        if ($tenant === null) {
            $this->command?->warn('Demo tenant not found; skipping tables seed.');
            return;
        }

        DB::transaction(function () use ($tenant): void {
            $zones = [
                ['name' => ['uz' => 'Asosiy zal', 'ru' => 'Основной зал', 'en' => 'Main hall'], 'sort_order' => 1],
                ['name' => ['uz' => 'VIP xona', 'ru' => 'VIP зал', 'en' => 'VIP room'], 'sort_order' => 2],
                ['name' => ['uz' => 'Terrasa', 'ru' => 'Терраса', 'en' => 'Terrace'], 'sort_order' => 3],
            ];

            $zoneModels = [];
            foreach ($zones as $z) {
                $slug = Str::slug($z['name']['en']);
                $zoneModels[$slug] = TableCategory::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'slug' => $slug],
                    [
                        'name' => $z['name'],
                        'sort_order' => $z['sort_order'],
                        'is_active' => true,
                    ],
                );
            }

            // Tables layout (name, capacity, shape, zone slug, x, y)
            $tables = [
                ['Stol 1', 2, 'round', 'main-hall', 120, 120],
                ['Stol 2', 4, 'round', 'main-hall', 300, 120],
                ['Stol 3', 4, 'round', 'main-hall', 480, 120],
                ['Stol 4', 6, 'rectangle', 'main-hall', 660, 120],
                ['Stol 5', 2, 'square', 'main-hall', 120, 300],
                ['Stol 6', 4, 'round', 'main-hall', 300, 300],
                ['Stol 7', 4, 'round', 'main-hall', 480, 300],
                ['Stol 8', 8, 'rectangle', 'main-hall', 660, 300],

                ['VIP 1', 8, 'oval', 'vip-room', 200, 500],
                ['VIP 2', 10, 'oval', 'vip-room', 500, 500],

                ['Terrasa 1', 4, 'round', 'terrace', 120, 700],
                ['Terrasa 2', 4, 'round', 'terrace', 300, 700],
                ['Terrasa 3', 4, 'round', 'terrace', 480, 700],
                ['Terrasa 4', 6, 'rectangle', 'terrace', 660, 700],
            ];

            foreach ($tables as [$name, $capacity, $shape, $zoneSlug, $x, $y]) {
                $zone = $zoneModels[$zoneSlug];
                Table::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'name' => $name],
                    [
                        'category_id' => $zone->id,
                        'capacity' => $capacity,
                        'shape' => $shape,
                        'position_x' => $x,
                        'position_y' => $y,
                        'status' => 'available',
                    ],
                );
            }

            $this->command?->info('Seeded ' . count($zones) . ' table zones and ' . count($tables) . ' tables.');
        });
    }
}
