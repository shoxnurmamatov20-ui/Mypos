<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'cook_id')) {
                // Cook who claimed this item
                $table->uuid('cook_id')->nullable()->after('status');
            }
            if (! Schema::hasColumn('order_items', 'started_preparing_at')) {
                $table->timestamp('started_preparing_at')->nullable()->after('cook_id');
            }
            if (! Schema::hasColumn('order_items', 'ready_at')) {
                $table->timestamp('ready_at')->nullable()->after('started_preparing_at');
            }
            if (! Schema::hasColumn('order_items', 'prep_duration_seconds')) {
                $table->integer('prep_duration_seconds')->nullable()->after('ready_at');
            }
        });

        if (Schema::hasColumn('order_items', 'cook_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->foreign('cook_id')
                    ->references('id')
                    ->on('employees')
                    ->nullOnDelete();
            });
        }

        Schema::table('order_items', function (Blueprint $table) {
            // Kitchen queue ordering: filter by status, sort by creation
            $table->index(['tenant_id', 'status', 'created_at'], 'order_items_tenant_status_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            try {
                $table->dropIndex('order_items_tenant_status_created_idx');
            } catch (\Throwable $e) {
                // ignore
            }

            if (Schema::hasColumn('order_items', 'cook_id')) {
                try {
                    $table->dropForeign(['cook_id']);
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            $columns = array_filter([
                Schema::hasColumn('order_items', 'prep_duration_seconds') ? 'prep_duration_seconds' : null,
                Schema::hasColumn('order_items', 'ready_at') ? 'ready_at' : null,
                Schema::hasColumn('order_items', 'started_preparing_at') ? 'started_preparing_at' : null,
                Schema::hasColumn('order_items', 'cook_id') ? 'cook_id' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
