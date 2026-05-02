<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add `tracking_token` to orders so guest (unauthenticated) consumers can
 * track their order via `/api/v1/public/orders/track/{token}` after a
 * marketplace checkout.
 *
 * The token is an unguessable UUID generated server-side at order creation
 * (CreatePublicOrderAction). It is stored in the clear because it is itself
 * the credential — we never expose Order.id to the consumer.
 *
 * Constraints:
 *   - UNIQUE — there's exactly one consumer-facing tracker per order
 *   - NULLABLE — pre-existing dine-in / kiosk orders never carry a token
 *   - INDEXED — public lookups are equality on `tracking_token` only
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        if (Schema::hasColumn('orders', 'tracking_token')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            $table->string('tracking_token', 64)
                ->nullable()
                ->after('order_no');

            $table->unique('tracking_token', 'orders_tracking_token_uq');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('orders') || ! Schema::hasColumn('orders', 'tracking_token')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            try {
                $table->dropUnique('orders_tracking_token_uq');
            } catch (\Throwable $e) {
                // already dropped
            }
            $table->dropColumn('tracking_token');
        });
    }
};
