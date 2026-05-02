<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('kiosk_pairing_codes')) {
            return;
        }

        Schema::create('kiosk_pairing_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            // 6-digit code; 8 chars allows future expansion / formatting
            $table->string('code', 8);

            // Device that consumed this code; null until paired
            $table->uuid('device_id')->nullable();

            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();

            // Admin (users.uuid) who generated the code
            $table->uuid('created_by_user_uuid')->nullable();

            $table->timestamps();

            // Unique within tenant — fast lookup at pair time
            $table->unique(['tenant_id', 'code'], 'kiosk_pairing_codes_tenant_code_uq');
            // Cleanup sweeps for expired codes
            $table->index('expires_at', 'kiosk_pairing_codes_expires_idx');
        });

        Schema::table('kiosk_pairing_codes', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('device_id')
                ->references('id')
                ->on('kiosk_devices')
                ->nullOnDelete();
            $table->foreign('created_by_user_uuid')
                ->references('uuid')
                ->on('users')
                ->nullOnDelete();
        });

        // Row-Level Security — tenant isolation (defense-in-depth)
        DB::statement('ALTER TABLE kiosk_pairing_codes ENABLE ROW LEVEL SECURITY');
        DB::statement("
            CREATE POLICY tenant_isolation_kiosk_pairing_codes ON kiosk_pairing_codes
            USING (tenant_id::text = current_setting('app.current_tenant_id', true))
        ");
    }

    public function down(): void
    {
        if (Schema::hasTable('kiosk_pairing_codes')) {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_kiosk_pairing_codes ON kiosk_pairing_codes');
            DB::statement('ALTER TABLE kiosk_pairing_codes DISABLE ROW LEVEL SECURITY');
        }
        Schema::dropIfExists('kiosk_pairing_codes');
    }
};
