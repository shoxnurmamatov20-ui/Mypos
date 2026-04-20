<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('user_uuid');

            $table->string('employee_code', 32);
            $table->string('position', 64);
            $table->date('hire_date');
            $table->integer('base_salary')->nullable();
            $table->integer('hourly_rate')->nullable();
            $table->string('status', 32)->default('active');
            $table->timestamp('terminated_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('emergency_contact', 128)->nullable();
            $table->jsonb('documents')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'employee_code']);
            $table->unique('user_uuid');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'position']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            // user_uuid references users.uuid (unique column, not PK which is bigint).
            $table->foreign('user_uuid')
                ->references('uuid')
                ->on('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
