<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Uzbekistan geography: regions (viloyat) + districts (tuman/city).
 *
 * Static reference data, NOT tenant-scoped — every tenant signing up needs to
 * pick a viloyat + tuman, so this must be readable before tenant context is
 * established. Lives alongside `countries` / `currencies`.
 *
 * Sourced from ShifoReyting (2026-05-20 port): 14 regions, ~180 districts,
 * trilingual names (UZ/RU/EN). Adds nullable region_id + district_id to
 * tenants so existing tenants are unaffected.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('regions')) {
            Schema::create('regions', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 8)->unique();
                $table->string('name_uz', 120);
                $table->string('name_ru', 120)->nullable();
                $table->string('name_en', 120)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('districts')) {
            Schema::create('districts', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('region_id')->constrained()->cascadeOnDelete();
                $table->string('code', 16)->unique();
                $table->string('name_uz', 140);
                $table->string('name_ru', 140)->nullable();
                $table->string('name_en', 140)->nullable();
                $table->enum('type', ['city', 'district', 'tuman'])->default('district');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index(['region_id', 'is_active']);
            });
        }

        if (Schema::hasTable('tenants')) {
            // `country_code` is added by 2026_07_01_000004_add_region_to_tenants
            // which has a LATER timestamp. On a fresh migrate, that column does
            // not exist yet — so we only use `->after()` opportunistically.
            $hasCountryCode = Schema::hasColumn('tenants', 'country_code');

            Schema::table('tenants', function (Blueprint $table) use ($hasCountryCode): void {
                if (! Schema::hasColumn('tenants', 'region_id')) {
                    $col = $table->foreignId('region_id')->nullable();
                    if ($hasCountryCode) {
                        $col->after('country_code');
                    }
                    $col->constrained('regions')->nullOnDelete();
                }
                if (! Schema::hasColumn('tenants', 'district_id')) {
                    $col = $table->foreignId('district_id')->nullable();
                    if (Schema::hasColumn('tenants', 'region_id')) {
                        $col->after('region_id');
                    }
                    $col->constrained('districts')->nullOnDelete();
                }
            });

            try {
                Schema::table('tenants', function (Blueprint $table): void {
                    $table->index(['region_id', 'district_id'], 'tenants_geo_idx');
                });
            } catch (\Throwable $e) {
                // index already exists
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table): void {
                try {
                    $table->dropIndex('tenants_geo_idx');
                } catch (\Throwable $e) {
                }
                foreach (['district_id', 'region_id'] as $col) {
                    if (Schema::hasColumn('tenants', $col)) {
                        try {
                            $table->dropForeign([$col]);
                        } catch (\Throwable $e) {
                        }
                        $table->dropColumn($col);
                    }
                }
            });
        }

        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
    }
};
