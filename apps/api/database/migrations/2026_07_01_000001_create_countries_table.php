<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4 — Multi-region expansion: Markaziy Osiyo (Central Asia).
 *
 * Static reference table for ISO 3166-1 alpha-2 country codes that MyPOS
 * officially supports. NO RLS: this is a global lookup. Every tenant can
 * (and must be able to) read it pre-tenant-context (e.g. during signup
 * when the user is choosing which country their restaurant is in).
 *
 * Seeded countries (initial Phase 4 launch):
 *   UZ — O'zbekiston   — UZS — uz   — +998 — Asia/Tashkent  (LIVE since 2026-01-01)
 *   KZ — Qozog'iston   — KZT — kz   — +7   — Asia/Almaty
 *   KG — Qirg'iziston  — KGS — ky   — +996 — Asia/Bishkek
 *   TJ — Tojikiston    — TJS — tg   — +992 — Asia/Dushanbe
 *   RU — Россия         — RUB — ru   — +7   — Europe/Moscow (diaspora marketing)
 *
 * Why a separate table (not just an enum):
 *   - i18n names ("Қозоғистон" vs "Казахстан" vs "Kazakhstan") need storage.
 *   - We want to enable/disable countries without code deploys
 *     (e.g. pausing KG signups while a regulatory issue is resolved).
 *   - launched_at lets the marketing site filter to "available now" vs
 *     "coming soon" without hardcoding dates.
 *
 * The PK is the 2-char ISO code itself, not a surrogate UUID — country codes
 * are stable, public, and already-canonical identifiers, so a separate id
 * would just add a join.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('countries')) {
            return;
        }

        Schema::create('countries', function (Blueprint $table): void {
            // ISO 3166-1 alpha-2: always 2 chars, uppercase. CHAR(2) is correct
            // here (fixed width) — varchar would waste a length byte.
            $table->char('code', 2)->primary();

            // Localized country name. Shape: { uz, ru, en, kz, ky, tg, ... }
            // Falls back to 'en' in the application layer when a locale is
            // missing.
            $table->jsonb('name');

            // ISO 4217 currency code. Soft FK — the constraint is added in the
            // currencies migration which comes next, otherwise we'd have a
            // chicken-and-egg ordering problem.
            $table->char('currency_code', 3);

            // BCP-47 language tag (subset). Used by the API to set the default
            // Accept-Language for tenants in this country, and as the fallback
            // for tenant_brands.default_locale at signup.
            $table->string('default_locale', 8);

            // E.164 prefix WITH leading '+'. 4 chars covers everything we
            // currently care about ('+998', '+992', '+996', '+7').
            $table->string('phone_prefix', 4);

            // IANA timezone — used as the default for tenants.timezone unless
            // overridden. Cities are correct here; abbreviations like 'UZT'
            // are deprecated.
            $table->string('timezone', 64);

            // Allows pausing signups from a country without dropping rows or
            // touching code. Default true — once we add a row, we accept it.
            $table->boolean('is_active')->default(true);

            // The date MyPOS officially launched in this market. NULL = soft-
            // launch / waitlist mode. The marketing site uses this for the
            // "Available now" vs "Coming Q3 2026" segmentation.
            $table->date('launched_at')->nullable();

            $table->timestamps();
        });

        // Seed the initial 5 countries. Use DB::table()->insert() so we don't
        // depend on any model/factory existing yet.
        $now = now();
        DB::table('countries')->insert([
            [
                'code'           => 'UZ',
                'name'           => json_encode([
                    'uz' => "O'zbekiston",
                    'ru' => 'Узбекистан',
                    'en' => 'Uzbekistan',
                    'kz' => 'Өзбекстан',
                    'ky' => 'Өзбекстан',
                    'tg' => 'Узбекистон',
                ], JSON_UNESCAPED_UNICODE),
                'currency_code'  => 'UZS',
                'default_locale' => 'uz',
                'phone_prefix'   => '+998',
                'timezone'       => 'Asia/Tashkent',
                'is_active'      => true,
                'launched_at'    => '2026-01-01',
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'code'           => 'KZ',
                'name'           => json_encode([
                    'uz' => "Qozog'iston",
                    'ru' => 'Казахстан',
                    'en' => 'Kazakhstan',
                    'kz' => 'Қазақстан',
                    'ky' => 'Казакстан',
                    'tg' => 'Қазоқистон',
                ], JSON_UNESCAPED_UNICODE),
                'currency_code'  => 'KZT',
                'default_locale' => 'kz',
                'phone_prefix'   => '+7',
                'timezone'       => 'Asia/Almaty',
                'is_active'      => true,
                'launched_at'    => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'code'           => 'KG',
                'name'           => json_encode([
                    'uz' => "Qirg'iziston",
                    'ru' => 'Кыргызстан',
                    'en' => 'Kyrgyzstan',
                    'kz' => 'Қырғызстан',
                    'ky' => 'Кыргызстан',
                    'tg' => 'Қирғизистон',
                ], JSON_UNESCAPED_UNICODE),
                'currency_code'  => 'KGS',
                'default_locale' => 'ky',
                'phone_prefix'   => '+996',
                'timezone'       => 'Asia/Bishkek',
                'is_active'      => true,
                'launched_at'    => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'code'           => 'TJ',
                'name'           => json_encode([
                    'uz' => 'Tojikiston',
                    'ru' => 'Таджикистан',
                    'en' => 'Tajikistan',
                    'kz' => 'Тәжікстан',
                    'ky' => 'Тажикстан',
                    'tg' => 'Тоҷикистон',
                ], JSON_UNESCAPED_UNICODE),
                'currency_code'  => 'TJS',
                'default_locale' => 'tg',
                'phone_prefix'   => '+992',
                'timezone'       => 'Asia/Dushanbe',
                'is_active'      => true,
                'launched_at'    => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'code'           => 'RU',
                'name'           => json_encode([
                    'uz' => 'Rossiya',
                    'ru' => 'Россия',
                    'en' => 'Russia',
                    'kz' => 'Ресей',
                    'ky' => 'Россия',
                    'tg' => 'Россия',
                ], JSON_UNESCAPED_UNICODE),
                'currency_code'  => 'RUB',
                'default_locale' => 'ru',
                'phone_prefix'   => '+7',
                'timezone'       => 'Europe/Moscow',
                'is_active'      => true,
                'launched_at'    => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
