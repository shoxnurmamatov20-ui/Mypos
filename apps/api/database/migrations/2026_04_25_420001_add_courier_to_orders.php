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
            if (! Schema::hasColumn('orders', 'courier_id')) {
                // Courier (employee) assigned to deliver this order
                $table->uuid('courier_id')->nullable()->after('served_by_id');
            }
            if (! Schema::hasColumn('orders', 'picked_up_at')) {
                // Courier picked the order up from the restaurant
                $table->timestamp('picked_up_at')->nullable()->after('cancelled_at');
            }
            if (! Schema::hasColumn('orders', 'delivering_at')) {
                // Courier en route to customer
                $table->timestamp('delivering_at')->nullable()->after('picked_up_at');
            }
            if (! Schema::hasColumn('orders', 'delivered_at')) {
                // Order handed to customer
                $table->timestamp('delivered_at')->nullable()->after('delivering_at');
            }
            if (! Schema::hasColumn('orders', 'delivery_distance_meters')) {
                $table->integer('delivery_distance_meters')->nullable()->after('delivered_at');
            }
            if (! Schema::hasColumn('orders', 'delivery_fee_minor')) {
                // Fee charged to customer (minor units, e.g. so'm)
                $table->integer('delivery_fee_minor')->nullable()->after('delivery_distance_meters');
            }
            if (! Schema::hasColumn('orders', 'courier_earnings_minor')) {
                // Amount paid to courier (may differ from delivery_fee_minor)
                $table->integer('courier_earnings_minor')->nullable()->after('delivery_fee_minor');
            }
            if (! Schema::hasColumn('orders', 'delivery_address')) {
                // { street, city, district, apartment, lat, lng, notes, phone }
                $table->jsonb('delivery_address')->nullable()->after('courier_earnings_minor');
            }
            if (! Schema::hasColumn('orders', 'delivery_phone')) {
                $table->string('delivery_phone', 32)->nullable()->after('delivery_address');
            }
            if (! Schema::hasColumn('orders', 'delivery_notes')) {
                $table->text('delivery_notes')->nullable()->after('delivery_phone');
            }
        });

        // 2) Add FK on courier_id and indexes (only when column exists)
        if (Schema::hasColumn('orders', 'courier_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('courier_id')
                    ->references('id')
                    ->on('employees')
                    ->nullOnDelete();

                // "My active deliveries" — courier filtered by status
                $table->index(
                    ['tenant_id', 'courier_id', 'status'],
                    'orders_tenant_courier_status_idx'
                );
                // Active deliveries dashboard — pickup-time ordering
                $table->index(
                    ['tenant_id', 'status', 'picked_up_at'],
                    'orders_tenant_status_pickedup_idx'
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
            // Drop indexes first (best-effort)
            try {
                $table->dropIndex('orders_tenant_courier_status_idx');
            } catch (\Throwable $e) {
                // ignore
            }
            try {
                $table->dropIndex('orders_tenant_status_pickedup_idx');
            } catch (\Throwable $e) {
                // ignore
            }

            if (Schema::hasColumn('orders', 'courier_id')) {
                try {
                    $table->dropForeign(['courier_id']);
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            $columns = array_filter([
                Schema::hasColumn('orders', 'delivery_notes') ? 'delivery_notes' : null,
                Schema::hasColumn('orders', 'delivery_phone') ? 'delivery_phone' : null,
                Schema::hasColumn('orders', 'delivery_address') ? 'delivery_address' : null,
                Schema::hasColumn('orders', 'courier_earnings_minor') ? 'courier_earnings_minor' : null,
                Schema::hasColumn('orders', 'delivery_fee_minor') ? 'delivery_fee_minor' : null,
                Schema::hasColumn('orders', 'delivery_distance_meters') ? 'delivery_distance_meters' : null,
                Schema::hasColumn('orders', 'delivered_at') ? 'delivered_at' : null,
                Schema::hasColumn('orders', 'delivering_at') ? 'delivering_at' : null,
                Schema::hasColumn('orders', 'picked_up_at') ? 'picked_up_at' : null,
                Schema::hasColumn('orders', 'courier_id') ? 'courier_id' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
