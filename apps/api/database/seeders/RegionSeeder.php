<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Shared\Models\Region;
use Illuminate\Database\Seeder;

/**
 * Uzbekistan viloyatlari — 14 ta.
 * Ported from ShifoReyting (2026-05-20).
 */
class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            ['code' => 'TSH', 'uz' => 'Toshkent shahri',          'ru' => 'Город Ташкент',             'en' => 'Tashkent City'],
            ['code' => 'TOV', 'uz' => 'Toshkent viloyati',        'ru' => 'Ташкентская область',       'en' => 'Tashkent Region'],
            ['code' => 'AND', 'uz' => 'Andijon viloyati',         'ru' => 'Андижанская область',       'en' => 'Andijan Region'],
            ['code' => 'FAR', 'uz' => "Farg'ona viloyati",        'ru' => 'Ферганская область',        'en' => 'Fergana Region'],
            ['code' => 'NAM', 'uz' => 'Namangan viloyati',        'ru' => 'Наманганская область',      'en' => 'Namangan Region'],
            ['code' => 'SAM', 'uz' => 'Samarqand viloyati',       'ru' => 'Самаркандская область',     'en' => 'Samarkand Region'],
            ['code' => 'BUX', 'uz' => 'Buxoro viloyati',          'ru' => 'Бухарская область',         'en' => 'Bukhara Region'],
            ['code' => 'XOR', 'uz' => 'Xorazm viloyati',          'ru' => 'Хорезмская область',        'en' => 'Khorezm Region'],
            ['code' => 'QAS', 'uz' => 'Qashqadaryo viloyati',     'ru' => 'Кашкадарьинская область',   'en' => 'Qashqadaryo Region'],
            ['code' => 'SUR', 'uz' => 'Surxondaryo viloyati',     'ru' => 'Сурхандарьинская область',  'en' => 'Surkhandarya Region'],
            ['code' => 'NAV', 'uz' => 'Navoiy viloyati',          'ru' => 'Навоийская область',        'en' => 'Navoi Region'],
            ['code' => 'JIZ', 'uz' => 'Jizzax viloyati',          'ru' => 'Джизакская область',        'en' => 'Jizzakh Region'],
            ['code' => 'SIR', 'uz' => 'Sirdaryo viloyati',        'ru' => 'Сырдарьинская область',     'en' => 'Syrdarya Region'],
            ['code' => 'QRK', 'uz' => "Qoraqalpog'iston Respublikasi", 'ru' => 'Республика Каракалпакстан', 'en' => 'Karakalpakstan Republic'],
        ];

        foreach ($regions as $r) {
            Region::updateOrCreate(
                ['code' => $r['code']],
                ['name_uz' => $r['uz'], 'name_ru' => $r['ru'], 'name_en' => $r['en'], 'is_active' => true],
            );
        }

        $this->command?->info(sprintf('Regions seeded: %d', count($regions)));
    }
}
