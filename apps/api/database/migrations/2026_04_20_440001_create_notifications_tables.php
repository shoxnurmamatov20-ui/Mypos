<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            $table->string('channel', 32);              // email|sms|push|telegram|in_app
            $table->string('recipient', 256);           // email, phone, device_token, chat_id
            $table->string('template', 64);             // order_placed|order_ready|...
            $table->string('subject', 256)->nullable();
            $table->text('body');
            $table->string('status', 32)->default('queued'); // queued|sent|failed|delivered|read
            $table->string('provider_message_id', 128)->nullable();
            $table->text('error_message')->nullable();
            $table->jsonb('metadata')->nullable();      // original payload

            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'channel', 'status']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::table('notifications_log', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_uuid');

            $table->string('channel', 32);              // email|sms|push|telegram|in_app
            $table->string('template', 64)->nullable(); // null = applies to all templates
            $table->boolean('enabled')->default(true);

            $table->timestamp('updated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_uuid', 'channel', 'template'], 'notif_pref_uq');
            $table->index('user_uuid');
        });

        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->foreign('user_uuid')
                ->references('uuid')
                ->on('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications_log');
    }
};
