<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('category_id')->nullable();
            $table->string('name', 64);
            $table->integer('capacity')->default(4);
            $table->string('status', 32)->default('available');
            $table->string('shape', 16)->default('round');
            $table->integer('position_x')->nullable();
            $table->integer('position_y')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->string('qr_code', 128)->nullable()->unique();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'name']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'category_id']);
        });

        Schema::table('tables', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('category_id')
                ->references('id')
                ->on('table_categories')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
