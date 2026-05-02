<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('kiosk_devices')) {
            return;
        }

        Schema::create('kiosk_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            $table->string('name', 64);
            $table->string('location_label', 128)->nullable();

            // bcrypt hash of device token; plaintext shown once at pair time
            $table->string('device_token_hash', 255)->nullable();
            $table->string('device_token_last4', 8)->nullable();

            $table->timestamp('paired_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->string('last_ip_address', 45)->nullable();
            $table->jsonb('device_info')->nullable(); // { os, app_version, screen_size, ... }

            // 'unpaired' | 'paired' | 'disabled'
            $table->string('status', 32)->default('unpaired');

            $table->string('language', 8)->nullable()->default('uz');
            $table->string('theme', 16)->nullable()->default('light'); // 'light' | 'dark'
            $table->integer('idle_timeout_seconds')->default(60);

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status'], 'kiosk_devices_tenant_status_idx');
            $table->index(['tenant_id', 'last_seen_at'], 'kiosk_devices_tenant_lastseen_idx');
            $table->unique('device_token_hash', 'kiosk_devices_token_hash_uq');
        });

        Schema::table('kiosk_devices', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });

        // Row-Level Security — tenant isolation (defense-in-depth)
        DB::statement('ALTER TABLE kiosk_devices ENABLE ROW LEVEL SECURITY');
        DB::statement("
            CREATE POLICY tenant_isolation_kiosk_devices ON kiosk_devices
            USING (tenant_id::text = current_setting('app.current_tenant_id', true))
        ");
    }

    public function down(): void
    {
        if (Schema::hasTable('kiosk_devices')) {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_kiosk_devices ON kiosk_devices');
            DB::statement('ALTER TABLE kiosk_devices DISABLE ROW LEVEL SECURITY');
        }
        Schema::dropIfExists('kiosk_devices');
    }
};
