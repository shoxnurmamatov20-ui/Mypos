<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Append-only audit log of admin actions, security events, and important
     * state changes. NO RLS: super admins must see ALL events across tenants.
     * Per-tenant filtering happens at the application layer via scopes.
     * NO updated_at: rows are immutable once written.
     */
    public function up(): void
    {
        if (Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Nullable: platform-wide events (e.g. super-admin login) have no tenant
            $table->uuid('tenant_id')->nullable();
            $table->uuid('actor_user_uuid')->nullable();

            // user | super_admin | system | api
            $table->string('actor_type', 32);
            // Human-readable label (email, name) at time of event — preserved across deletes
            $table->string('actor_label', 128)->nullable();

            // e.g. tenant.created, tenant.suspended, user.login, staff.pin_login_failed
            $table->string('action', 64);

            $table->string('subject_type', 64)->nullable();
            $table->uuid('subject_id')->nullable();
            $table->string('subject_label', 255)->nullable();

            // debug | info | warning | error | critical
            $table->string('severity', 16)->default('info');

            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->jsonb('metadata')->nullable();

            // Append-only — only created_at; never updated.
            $table->timestamp('created_at')->useCurrent();
        });

        // Foreign keys (nullOnDelete preserves history)
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')->on('tenants')
                ->nullOnDelete();
            $table->foreign('actor_user_uuid')
                ->references('uuid')->on('users')
                ->nullOnDelete();

            // Per-tenant audit views (most recent first)
            $table->index(['tenant_id', 'created_at'], 'audit_logs_tenant_created_idx');
            // "Who did what" queries
            $table->index(['actor_user_uuid', 'created_at'], 'audit_logs_actor_created_idx');
            // "Recent X events" (e.g. all failed logins)
            $table->index(['action', 'created_at'], 'audit_logs_action_created_idx');
            // Security alerts dashboards
            $table->index(['severity', 'created_at'], 'audit_logs_severity_created_idx');
            // History of a specific subject (e.g. one tenant, one order)
            $table->index(
                ['subject_type', 'subject_id', 'created_at'],
                'audit_logs_subject_created_idx'
            );
            // General "recent events" feed
            $table->index('created_at', 'audit_logs_created_at_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }
        Schema::dropIfExists('audit_logs');
    }
};
