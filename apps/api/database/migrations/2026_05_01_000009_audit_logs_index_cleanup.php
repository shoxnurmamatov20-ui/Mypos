<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit L9: `audit_logs` is over-indexed.
 *
 * The create migration added 6 indexes:
 *   - audit_logs_tenant_created_idx     (tenant_id, created_at)
 *   - audit_logs_actor_created_idx      (actor_user_uuid, created_at)
 *   - audit_logs_action_created_idx     (action, created_at)
 *   - audit_logs_severity_created_idx   (severity, created_at)
 *   - audit_logs_subject_created_idx    (subject_type, subject_id, created_at)
 *   - audit_logs_created_at_idx         (created_at)            ← redundant
 *
 * `audit_logs_created_at_idx` is fully covered by every other composite
 * that *leads* with another column and *trails* with `created_at`. PG can
 * use any of those for an ORDER BY created_at scan when the leading column
 * has bounded cardinality. The standalone single-column index gains us
 * nothing on reads but slows every INSERT (and audit_logs is append-only,
 * so the write tax is felt on every admin action).
 *
 * Verdict: drop it.
 *
 * NO-OP on sqlite/mysql: indexes use PG-specific naming conventions and
 * `IF EXISTS` semantics; the cost on small test DBs is also negligible.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS audit_logs_created_at_idx');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        // Recreate to match the original create migration so a full
        // up/down/up cycle leaves the schema identical.
        DB::statement(
            'CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx '
            . 'ON audit_logs (created_at)'
        );
    }
};
