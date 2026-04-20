<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('category_id')->nullable();

            $table->jsonb('name');
            $table->string('sku', 64)->nullable();
            $table->string('unit', 16); // kg, g, L, ml, piece, etc

            // Money stored as minor units (so'm for UZS)
            $table->integer('cost_per_unit');

            $table->decimal('current_stock', 12, 3)->default(0);
            $table->decimal('min_stock', 12, 3)->nullable();
            $table->decimal('reorder_point', 12, 3)->nullable();

            $table->boolean('is_active')->default(true);
            $table->jsonb('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('category_id')
                ->references('id')
                ->on('ingredient_categories')
                ->nullOnDelete();

            // Unique SKU per tenant when present
            $table->unique(['tenant_id', 'sku']);
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
