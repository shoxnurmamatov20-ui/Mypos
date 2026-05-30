<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('courier_locations')) {
            return;
        }

        Schema::create('courier_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('employee_id');           // courier (employees.id)
            $table->uuid('order_id')->nullable();  // current delivery, if any

            // GPS reading — decimal for portability across DBs / Eloquent casts
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->decimal('accuracy_meters', 8, 2)->nullable();
            $table->decimal('heading', 5, 2)->nullable();   // 0-360 compass bearing
            $table->decimal('speed_mps', 6, 2)->nullable(); // meters per second
            $table->integer('battery_percent')->nullable();

            // When the GPS reading was taken (client-side)
            $table->timestamp('recorded_at');

            $table->timestamps();

            // "Latest position per courier" — DESC on recorded_at
            $table->index(
                ['tenant_id', 'employee_id', 'recorded_at'],
                'courier_locations_tenant_emp_recorded_idx'
            );
            // "Track for an order" — DESC on recorded_at
            $table->index(
                ['tenant_id', 'order_id', 'recorded_at'],
                'courier_locations_tenant_order_recorded_idx'
            );
            // Cleanup / retention sweeps
            $table->index('recorded_at', 'courier_locations_recorded_idx');
        });

        Schema::table('courier_locations', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->cascadeOnDelete();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->nullOnDelete();
        });

        // Row-Level Security — Postgres only (ADR-0005, 2026-05-10).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY');
            DB::statement("
                CREATE POLICY tenant_isolation_courier_locations ON courier_locations
                USING (tenant_id::text = current_setting('app.current_tenant_id', true))
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('courier_locations') && DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_courier_locations ON courier_locations');
            DB::statement('ALTER TABLE courier_locations DISABLE ROW LEVEL SECURITY');
        }
        Schema::dropIfExists('courier_locations');
    }
};
