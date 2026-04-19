<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 64)->unique();
            $table->string('name', 128);
            $table->string('legal_name', 256)->nullable();
            $table->string('plan', 32)->default('free');
            $table->string('status', 32)->default('trialing');
            $table->string('default_locale', 8)->default('uz');
            $table->string('default_currency', 8)->default('UZS');
            $table->string('timezone', 64)->default('Asia/Tashkent');
            $table->string('phone', 32)->nullable();
            $table->string('email', 128)->nullable();
            $table->string('logo_url', 512)->nullable();
            $table->jsonb('settings')->nullable();
            $table->jsonb('feature_flags')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('plan');
            $table->index('status');
        });

        Schema::create('tenant_registration_pins', function (Blueprint $table) {
            $table->id();
            $table->string('pin', 16)->unique();
            $table->uuid('tenant_id')->nullable();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->uuid('issued_by')->nullable(); // super admin user
            $table->timestamp('used_at')->nullable();
            $table->uuid('used_by')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('used_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_registration_pins');
        Schema::dropIfExists('tenants');
    }
};
