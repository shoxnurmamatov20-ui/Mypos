<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_reviews', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->unsignedTinyInteger('food_rating')->nullable();
            $table->unsignedTinyInteger('delivery_rating')->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['order_id']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_reviews');
    }
};
