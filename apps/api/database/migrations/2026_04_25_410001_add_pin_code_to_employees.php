<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'pin_code_hash')) {
                // bcrypt hash of 4-6 digit PIN; null = no PIN set yet
                $table->string('pin_code_hash', 255)->nullable()->after('status');
            }
            if (! Schema::hasColumn('employees', 'pin_set_at')) {
                $table->timestamp('pin_set_at')->nullable()->after('pin_code_hash');
            }
            if (! Schema::hasColumn('employees', 'last_clock_in_at')) {
                // Denormalized from latest clock event for fast queries
                $table->timestamp('last_clock_in_at')->nullable()->after('pin_set_at');
            }
        });

        // Tenant-scoped PIN lookup index (only if both columns exist)
        if (Schema::hasColumn('employees', 'pin_code_hash')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->index(['tenant_id', 'pin_code_hash'], 'employees_tenant_pin_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'pin_code_hash')) {
                $table->dropIndex('employees_tenant_pin_idx');
            }
        });

        Schema::table('employees', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('employees', 'last_clock_in_at') ? 'last_clock_in_at' : null,
                Schema::hasColumn('employees', 'pin_set_at') ? 'pin_set_at' : null,
                Schema::hasColumn('employees', 'pin_code_hash') ? 'pin_code_hash' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
