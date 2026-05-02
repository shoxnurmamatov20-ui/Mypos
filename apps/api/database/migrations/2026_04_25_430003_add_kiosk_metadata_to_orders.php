<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        // 1) Add columns (defensive — only if missing)
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'kiosk_device_id')) {
                $table->uuid('kiosk_device_id')->nullable();
            }
            if (! Schema::hasColumn('orders', 'kiosk_session_id')) {
                // Logical grouping for events from same kiosk session — no FK
                $table->uuid('kiosk_session_id')->nullable();
            }
            if (! Schema::hasColumn('orders', 'customer_phone_for_receipt')) {
                $table->string('customer_phone_for_receipt', 32)->nullable();
            }
        });

        // 2) FK + indexes — only after column exists & target table present
        if (
            Schema::hasColumn('orders', 'kiosk_device_id')
            && Schema::hasTable('kiosk_devices')
        ) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('kiosk_device_id')
                    ->references('id')
                    ->on('kiosk_devices')
                    ->nullOnDelete();

                // Per-device order history
                $table->index(
                    ['tenant_id', 'kiosk_device_id', 'created_at'],
                    'orders_tenant_kiosk_device_created_idx'
                );
            });
        }

        if (Schema::hasColumn('orders', 'kiosk_session_id')) {
            Schema::table('orders', function (Blueprint $table) {
                // Find orders for a given kiosk session
                $table->index(
                    ['tenant_id', 'kiosk_session_id'],
                    'orders_tenant_kiosk_session_idx'
                );
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            // Drop indexes (best-effort)
            try {
                $table->dropIndex('orders_tenant_kiosk_device_created_idx');
            } catch (\Throwable $e) {
                // ignore
            }
            try {
                $table->dropIndex('orders_tenant_kiosk_session_idx');
            } catch (\Throwable $e) {
                // ignore
            }

            if (Schema::hasColumn('orders', 'kiosk_device_id')) {
                try {
                    $table->dropForeign(['kiosk_device_id']);
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            $columns = array_filter([
                Schema::hasColumn('orders', 'customer_phone_for_receipt') ? 'customer_phone_for_receipt' : null,
                Schema::hasColumn('orders', 'kiosk_session_id') ? 'kiosk_session_id' : null,
                Schema::hasColumn('orders', 'kiosk_device_id') ? 'kiosk_device_id' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
