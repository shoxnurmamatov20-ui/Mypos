<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('order_id');

            // cash|card|click|payme|uzum|apelsin
            $table->string('provider', 32);
            $table->string('provider_transaction_id', 128)->nullable();

            $table->integer('amount');
            $table->string('currency', 8)->default('UZS');

            // pending|authorized|captured|failed|refunded|cancelled
            $table->string('status', 32)->default('pending');
            $table->string('failure_reason', 256)->nullable();

            $table->jsonb('raw_request')->nullable();
            $table->jsonb('raw_response')->nullable();

            $table->string('idempotency_key', 128)->nullable()->unique();

            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('failed_at')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'order_id']);
            $table->index(['provider', 'provider_transaction_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
