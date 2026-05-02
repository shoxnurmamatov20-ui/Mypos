<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // employee_id already exists in orders (references users.uuid). We only add
        // the composite index for fast "my orders" queries. Adding the dedicated
        // served_by_id column for the waiter, FK to employees.id.
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'employee_id')) {
                // Index for "my orders" with recency ordering
                $table->index(['tenant_id', 'employee_id', 'created_at'], 'orders_tenant_emp_created_idx');
            } else {
                $table->uuid('employee_id')->nullable()->after('customer_id');
                $table->foreign('employee_id')
                    ->references('id')
                    ->on('employees')
                    ->nullOnDelete();
                $table->index(['tenant_id', 'employee_id', 'created_at'], 'orders_tenant_emp_created_idx');
            }

            if (! Schema::hasColumn('orders', 'served_by_id')) {
                // Waiter who served the table; may differ from order creator
                $table->uuid('served_by_id')->nullable()->after('employee_id');
            }
        });

        if (Schema::hasColumn('orders', 'served_by_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('served_by_id')
                    ->references('id')
                    ->on('employees')
                    ->nullOnDelete();
                $table->index(['tenant_id', 'served_by_id'], 'orders_tenant_served_by_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Best-effort drop of indexes/FKs added in up()
            try {
                $table->dropIndex('orders_tenant_emp_created_idx');
            } catch (\Throwable $e) {
                // ignore
            }

            if (Schema::hasColumn('orders', 'served_by_id')) {
                try {
                    $table->dropIndex('orders_tenant_served_by_idx');
                } catch (\Throwable $e) {
                    // ignore
                }
                try {
                    $table->dropForeign(['served_by_id']);
                } catch (\Throwable $e) {
                    // ignore
                }
                $table->dropColumn('served_by_id');
            }
        });
    }
};
