<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4 — ISO 4217 currency lookup table.
 *
 * Static reference. NO RLS — same rationale as countries: pre-tenant-context
 * reads (signup, marketing site), and every tenant must see all currencies
 * for FX-based reporting.
 *
 * Critical detail: `decimals` is the number of fractional digits in the
 * standard subdivision. UZS uses 0 (we don't have so'm cents in practice —
 * the legacy "tiyin" is functionally extinct), while KZT, KGS, TJS, RUB,
 * USD, EUR all use 2. Application code multiplies by 10^decimals to convert
 * a display amount into the integer-minor-unit storage used by orders.total_amount.
 *
 * Adding the FK from countries.currency_code → currencies.code is done HERE
 * (after both tables exist) rather than in the countries migration, otherwise
 * we'd reference a not-yet-created parent.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('currencies')) {
            return;
        }

        Schema::create('currencies', function (Blueprint $table): void {
            // ISO 4217: always 3 chars, uppercase. CHAR(3) is correct.
            $table->char('code', 3)->primary();

            // Localized name. { uz, ru, en, ... }
            $table->jsonb('name');

            // Display symbol. Up to 8 chars to accommodate multi-glyph
            // symbols ("so'm", "TJS", "сом") and any future weirdness.
            $table->string('symbol', 8);

            // Number of fractional digits. SMALLINT (1 byte vs 4) — values
            // are 0..4 in practice. NOT NULL; default 2 covers most cases.
            $table->smallInteger('decimals')->default(2);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed core currencies. UZS is the only zero-decimal currency in the
        // initial set; this matters because format_money() in the application
        // layer divides by 10^decimals when rendering.
        $now = now();
        DB::table('currencies')->insert([
            [
                'code'       => 'UZS',
                'name'       => json_encode([
                    'uz' => "O'zbek so'mi",
                    'ru' => 'Узбекский сум',
                    'en' => 'Uzbek Som',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => "so'm",
                'decimals'   => 0,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code'       => 'KZT',
                'name'       => json_encode([
                    'uz' => 'Qozog\'iston tengesi',
                    'ru' => 'Казахстанский тенге',
                    'en' => 'Kazakhstani Tenge',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => '₸',
                'decimals'   => 2,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code'       => 'KGS',
                'name'       => json_encode([
                    'uz' => 'Qirg\'iz somi',
                    'ru' => 'Киргизский сом',
                    'en' => 'Kyrgyzstani Som',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => 'с',
                'decimals'   => 2,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code'       => 'TJS',
                'name'       => json_encode([
                    'uz' => 'Tojik somonisi',
                    'ru' => 'Таджикский сомони',
                    'en' => 'Tajikistani Somoni',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => 'TJS',
                'decimals'   => 2,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code'       => 'USD',
                'name'       => json_encode([
                    'uz' => 'AQSh dollari',
                    'ru' => 'Доллар США',
                    'en' => 'US Dollar',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => '$',
                'decimals'   => 2,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code'       => 'RUB',
                'name'       => json_encode([
                    'uz' => 'Rossiya rubli',
                    'ru' => 'Российский рубль',
                    'en' => 'Russian Ruble',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => '₽',
                'decimals'   => 2,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code'       => 'EUR',
                'name'       => json_encode([
                    'uz' => 'Yevro',
                    'ru' => 'Евро',
                    'en' => 'Euro',
                ], JSON_UNESCAPED_UNICODE),
                'symbol'     => '€',
                'decimals'   => 2,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Now that BOTH currencies and countries exist, retroactively add the
        // FK from countries.currency_code → currencies.code. Wrapped in a
        // hasTable check because in some contrived test scenarios countries
        // may not have been created yet.
        if (Schema::hasTable('countries')) {
            Schema::table('countries', function (Blueprint $table): void {
                $table->foreign('currency_code')
                    ->references('code')
                    ->on('currencies')
                    ->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Drop the FK first (otherwise dropping currencies fails with a
        // referential-integrity error).
        if (Schema::hasTable('countries')) {
            Schema::table('countries', function (Blueprint $table): void {
                try {
                    $table->dropForeign(['currency_code']);
                } catch (\Throwable $e) {
                    // FK didn't exist — fine.
                }
            });
        }

        Schema::dropIfExists('currencies');
    }
};
