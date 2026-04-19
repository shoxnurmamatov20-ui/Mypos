<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('order_no', 32);
            $table->string('type', 32)->default('dine_in');  // dine_in|takeaway|delivery|kiosk|qr_menu|telegram
            $table->string('status', 32)->default('pending'); // draft|pending|preparing|ready|served|completed|cancelled|refunded
            $table->string('payment_status', 32)->default('unpaid'); // unpaid|partial|paid|refunded
            $table->string('payment_method', 32)->nullable(); // cash|card|click|payme|uzum|apelsin

            $table->uuid('table_id')->nullable();
            $table->uuid('customer_id')->nullable();
            $table->uuid('employee_id')->nullable();

            $table->integer('guest_count')->nullable();

            // Money (integer minor units — UZS uses so'm as unit)
            $table->integer('subtotal_amount')->default(0);
            $table->integer('tax_amount')->default(0);
            $table->integer('discount_amount')->default(0);
            $table->integer('tip_amount')->default(0);
            $table->integer('service_charge_amount')->default(0);
            $table->integer('total_amount')->default(0);
            $table->integer('paid_amount')->default(0);
            $table->string('currency', 8)->default('UZS');

            $table->text('notes')->nullable();
            $table->jsonb('metadata')->nullable();

            $table->timestamp('placed_at')->nullable();      // transition to pending
            $table->timestamp('prepared_at')->nullable();    // transition to ready
            $table->timestamp('served_at')->nullable();      // transition to served
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'order_no']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'table_id']);
            $table->index(['tenant_id', 'employee_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('table_id')
                ->references('id')
                ->on('tables')
                ->nullOnDelete();
            // employee_id references users.uuid (not users.id which is bigint)
            $table->foreign('employee_id')
                ->references('uuid')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
