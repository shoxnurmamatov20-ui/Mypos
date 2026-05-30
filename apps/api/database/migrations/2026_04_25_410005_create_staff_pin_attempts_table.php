<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('staff_pin_attempts')) {
            return;
        }

        Schema::create('staff_pin_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // tenant_id is nullable — phone alone may not resolve a tenant
            $table->uuid('tenant_id')->nullable();
            $table->string('phone', 32);
            $table->string('ip_address', 45)->nullable();
            $table->boolean('success')->default(false);
            $table->timestamp('attempted_at')->useCurrent();

            $table->timestamps();

            // Quickly count failed attempts in last N minutes
            $table->index(['phone', 'attempted_at'], 'staff_pin_attempts_phone_attempted_idx');
        });

        Schema::table('staff_pin_attempts', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_pin_attempts');
    }
};
