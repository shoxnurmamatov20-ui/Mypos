<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('loyalty_programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            $table->jsonb('name');                              // {"uz": "...", "ru": "...", "en": "..."}
            $table->boolean('is_active')->default(true);
            $table->decimal('points_per_currency_unit', 10, 4)->default(0.01);   // 1 point per 100 UZS
            $table->integer('redemption_rate_uzs')->default(10);                 // 1 point = 10 UZS
            $table->jsonb('tier_rules')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::table('loyalty_programs', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });

        Schema::create('loyalty_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('customer_id');
            $table->uuid('program_id');

            $table->string('tier', 32)->default('bronze');   // bronze|silver|gold|platinum
            $table->integer('points_balance')->default(0);
            $table->integer('lifetime_points')->default(0);

            $table->timestamps();

            $table->unique(['customer_id', 'program_id']);
            $table->index(['tenant_id', 'tier']);
        });

        Schema::table('loyalty_accounts', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();
            $table->foreign('program_id')
                ->references('id')
                ->on('loyalty_programs')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_accounts');
        Schema::dropIfExists('loyalty_programs');
    }
};
