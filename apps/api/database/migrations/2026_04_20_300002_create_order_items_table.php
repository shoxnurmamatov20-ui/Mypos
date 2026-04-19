<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('order_id');
            $table->uuid('menu_item_id')->nullable();

            // Snapshot at time of order (preserves history if menu item changes/deletes)
            $table->string('name_snapshot', 256);
            $table->integer('price_amount');              // unit price
            $table->integer('quantity')->default(1);
            $table->integer('subtotal_amount');            // price × qty + modifier sum
            $table->string('currency', 8)->default('UZS');

            $table->jsonb('modifiers')->nullable();       // [{id, name, price_delta}]
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('pending'); // pending|preparing|ready|served|cancelled

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'menu_item_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();
            $table->foreign('menu_item_id')
                ->references('id')
                ->on('menu_items')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
