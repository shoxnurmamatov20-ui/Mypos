<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('employee_id');

            // useCurrent() — MySQL strict mode rejects implicit `0000-00-00`
            // defaults on NOT NULL TIMESTAMP. Insert paths set both explicitly,
            // so the default only fires for legacy fixtures.
            $table->timestamp('scheduled_start')->useCurrent();
            $table->timestamp('scheduled_end')->useCurrent();
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();
            $table->string('status', 32)->default('scheduled');
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'employee_id', 'scheduled_start']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
