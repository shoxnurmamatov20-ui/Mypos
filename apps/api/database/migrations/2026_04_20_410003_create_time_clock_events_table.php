<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('time_clock_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('shift_id')->nullable();
            $table->uuid('employee_id');

            $table->string('event_type', 32);
            $table->timestamp('recorded_at');
            $table->string('source', 32)->default('manual');
            $table->jsonb('metadata')->nullable();

            $table->timestamp('created_at')->nullable();

            $table->index(['tenant_id', 'employee_id', 'recorded_at']);
            $table->index(['tenant_id', 'shift_id']);
        });

        Schema::table('time_clock_events', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('shift_id')
                ->references('id')
                ->on('shifts')
                ->nullOnDelete();
            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_clock_events');
    }
};
