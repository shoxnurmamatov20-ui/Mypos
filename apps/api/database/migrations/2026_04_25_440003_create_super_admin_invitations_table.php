<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Invitations to the super-admin panel. Global (no tenant_id) — only
     * super admins access this table, so no RLS policy needed.
     */
    public function up(): void
    {
        if (Schema::hasTable('super_admin_invitations')) {
            return;
        }

        Schema::create('super_admin_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('email', 255);
            // SHA-256 hash of the invitation token (raw token never stored)
            $table->string('token_hash', 255)->unique();

            $table->uuid('invited_by_user_uuid');

            $table->timestamp('accepted_at')->nullable();
            $table->uuid('accepted_by_user_uuid')->nullable();

            // Typically created_at + 7 days
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();

            // Stores intended role / permissions until acceptance
            $table->jsonb('metadata')->nullable();

            $table->timestamps();
        });

        Schema::table('super_admin_invitations', function (Blueprint $table) {
            $table->foreign('invited_by_user_uuid')
                ->references('uuid')->on('users')
                ->cascadeOnDelete();
            $table->foreign('accepted_by_user_uuid')
                ->references('uuid')->on('users')
                ->nullOnDelete();

            // Lookup by recipient
            $table->index('email', 'super_admin_invitations_email_idx');
            // Cleanup sweep for expired invitations
            $table->index('expires_at', 'super_admin_invitations_expires_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('super_admin_invitations')) {
            return;
        }
        Schema::dropIfExists('super_admin_invitations');
    }
};
