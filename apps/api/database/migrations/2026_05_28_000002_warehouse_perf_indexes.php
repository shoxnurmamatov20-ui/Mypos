<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds composite indexes for the dominant manager-panel list query:
 *
 *   WHERE tenant_id = ? AND status = ? AND <date> BETWEEN ? AND ?
 *   ORDER BY <date> DESC
 *
 * Before this, MySQL had to pick one of two single-column-prefixed indexes
 * and back-fill the other filter, which degrades sharply past ~100K posted
 * rows per tenant. Composite covers all 3 filter columns + the ORDER BY
 * direction.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('incoming_documents', function (Blueprint $t): void {
            $t->index(['tenant_id', 'status', 'doc_date'], 'incoming_doc_tenant_status_date_idx');
        });

        Schema::table('waste_documents', function (Blueprint $t): void {
            $t->index(['tenant_id', 'status', 'doc_date'], 'waste_doc_tenant_status_date_idx');
        });

        Schema::table('audit_sessions', function (Blueprint $t): void {
            $t->index(['tenant_id', 'status', 'started_at'], 'audit_session_tenant_status_started_idx');
        });

        Schema::table('transfer_documents', function (Blueprint $t): void {
            $t->index(['tenant_id', 'status', 'doc_date'], 'transfer_doc_tenant_status_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('incoming_documents', function (Blueprint $t): void {
            $t->dropIndex('incoming_doc_tenant_status_date_idx');
        });

        Schema::table('waste_documents', function (Blueprint $t): void {
            $t->dropIndex('waste_doc_tenant_status_date_idx');
        });

        Schema::table('audit_sessions', function (Blueprint $t): void {
            $t->dropIndex('audit_session_tenant_status_started_idx');
        });

        Schema::table('transfer_documents', function (Blueprint $t): void {
            $t->dropIndex('transfer_doc_tenant_status_date_idx');
        });
    }
};
