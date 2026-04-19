<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->uuid('category_id');
            $table->foreign('category_id')
                ->references('id')
                ->on('menu_categories')
                ->restrictOnDelete();

            $table->jsonb('name');         // {"uz": "...", "ru": "...", "en": "..."}
            $table->jsonb('description')->nullable();
            $table->string('slug', 192);
            $table->string('sku', 64)->nullable();

            // Money stored as minor units (tiyin for UZS = same as so'm)
            $table->integer('price_amount');
            $table->string('price_currency', 8)->default('UZS');
            $table->integer('cost_amount')->nullable();

            $table->string('image_url', 512)->nullable();
            $table->string('thumbnail_url', 512)->nullable();

            // Badges + metadata
            $table->jsonb('allergens')->nullable();   // ["gluten", "dairy", ...]
            $table->jsonb('tags')->nullable();        // ["vegan", "spicy", "new"]
            $table->integer('calories')->nullable();
            $table->integer('preparation_minutes')->nullable();

            // Availability
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_new')->default(false);
            $table->boolean('has_discount')->default(false);
            $table->integer('discount_percent')->nullable();

            // Stock tracking
            $table->boolean('stock_tracked')->default(false);
            $table->integer('current_stock')->nullable();
            $table->integer('low_stock_threshold')->nullable();

            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'is_featured']);
            $table->index(['tenant_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
