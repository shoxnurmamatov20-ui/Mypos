<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('shift_breaks')) {
            return;
        }

        Schema::create('shift_breaks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('shift_id');
            $table->uuid('employee_id');

            // useCurrent() — MySQL strict mode rejects implicit `0000-00-00`
            // defaults on NOT NULL TIMESTAMP. Insert paths set this explicitly.
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_minutes')->nullable(); // populated when ended
            $table->string('reason', 64)->nullable();        // 'lunch', 'rest', 'personal'
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'shift_id'], 'shift_breaks_tenant_shift_idx');
            $table->index(['tenant_id', 'employee_id', 'started_at'], 'shift_breaks_tenant_emp_started_idx');
        });

        Schema::table('shift_breaks', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('shift_id')
                ->references('id')
                ->on('shifts')
                ->cascadeOnDelete();
            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->cascadeOnDelete();
        });

        // Row-Level Security — Postgres only (ADR-0005, 2026-05-10).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE shift_breaks ENABLE ROW LEVEL SECURITY');
            DB::statement("
                CREATE POLICY tenant_isolation_shift_breaks ON shift_breaks
                USING (tenant_id::text = current_setting('app.current_tenant_id', true))
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('shift_breaks') && DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_shift_breaks ON shift_breaks');
            DB::statement('ALTER TABLE shift_breaks DISABLE ROW LEVEL SECURITY');
        }
        Schema::dropIfExists('shift_breaks');
    }
};
