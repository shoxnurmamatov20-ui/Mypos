<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            $table->string('phone', 32);
            $table->string('email', 128)->nullable();
            $table->string('first_name', 64);
            $table->string('last_name', 64)->nullable();
            $table->date('birthday')->nullable();
            $table->string('locale', 8)->default('uz');
            $table->string('gender', 16)->nullable();
            $table->string('avatar_url', 512)->nullable();

            $table->jsonb('tags')->nullable();     // ["VIP", "regular", ...]
            $table->text('notes')->nullable();

            $table->integer('total_orders')->default(0);
            $table->integer('total_spent')->default(0);  // minor units (so'm)
            $table->timestamp('last_visit_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'last_visit_at']);
            $table->index(['tenant_id', 'email']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
