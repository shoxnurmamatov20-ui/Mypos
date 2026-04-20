<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('ingredient_id');

            $table->decimal('delta', 12, 3);          // positive receive, negative consume
            $table->decimal('balance_after', 12, 3);
            $table->string('reason', 64);             // order_consume|purchase|adjust|waste|transfer
            $table->string('reference_type', 64)->nullable(); // e.g. "order", "purchase_order"
            $table->uuid('reference_id')->nullable();
            $table->integer('cost_per_unit')->nullable(); // for purchases
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at');
            $table->uuid('created_by')->nullable();   // user uuid
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('ingredient_id')
                ->references('id')
                ->on('ingredients')
                ->cascadeOnDelete();

            $table->index(['tenant_id', 'ingredient_id', 'recorded_at'], 'stock_mov_tenant_ing_time_idx');
            $table->index(['tenant_id', 'reason']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
