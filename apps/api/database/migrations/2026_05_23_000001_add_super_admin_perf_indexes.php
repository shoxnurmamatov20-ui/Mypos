<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Super-admin dashboard / billing / audit perf indexes.
 *
 * The super-admin context queries every table WITHOUT a tenant filter
 * (cross-tenant aggregates). The existing per-tenant compound indexes
 * (`tenant_id, status, ...`) don't help those queries — MariaDB falls
 * back to full-table scans on filters like `WHERE status IN (...)` or
 * `WHERE created_at >= X`.
 *
 * This migration adds the standalone single-column / cross-tenant
 * compound indexes those aggregate queries need.
 *
 * All `addIndex` calls are guarded with `Schema::hasIndex` to keep this
 * migration idempotent.
 */
return new class extends Migration {
    public function up(): void
    {
        // --- tenants ----------------------------------------------------
        Schema::table('tenants', function (Blueprint $t): void {
            // Growth queries: WHERE created_at >= ?
            if (! $this->indexExists('tenants', 'tenants_created_at_idx')) {
                $t->index('created_at', 'tenants_created_at_idx');
            }
            // MRR aggregate: SUM(mrr_minor) WHERE subscription_status IN (...)
            if (! $this->indexExists('tenants', 'tenants_sub_status_mrr_idx')) {
                $t->index(['subscription_status', 'mrr_minor'], 'tenants_sub_status_mrr_idx');
            }
            // Paying-tenant count: WHERE mrr_minor > 0
            if (! $this->indexExists('tenants', 'tenants_mrr_minor_idx')) {
                $t->index('mrr_minor', 'tenants_mrr_minor_idx');
            }
        });

        // --- orders -----------------------------------------------------
        Schema::table('orders', function (Blueprint $t): void {
            // Cross-tenant date range (used by SuperAdmin charts):
            //   WHERE created_at BETWEEN ? AND ?
            //   GROUP BY DATE(created_at)
            // Existing index leads with tenant_id which never matches here.
            if (! $this->indexExists('orders', 'orders_created_at_idx')) {
                $t->index('created_at', 'orders_created_at_idx');
            }
            // Cross-tenant status + date filter (revenue chart):
            //   WHERE created_at BETWEEN ? AND ? AND status IN (...)
            if (! $this->indexExists('orders', 'orders_status_created_idx')) {
                $t->index(['status', 'created_at'], 'orders_status_created_idx');
            }
        });

        // --- payments ---------------------------------------------------
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $t): void {
                if (! $this->indexExists('payments', 'payments_created_at_idx')) {
                    $t->index('created_at', 'payments_created_at_idx');
                }
                if (! $this->indexExists('payments', 'payments_status_created_idx')) {
                    $t->index(['status', 'created_at'], 'payments_status_created_idx');
                }
            });
        }

        // --- users ------------------------------------------------------
        // SuperAdmin "active today" KPI: WHERE last_login_at >= startOfDay
        Schema::table('users', function (Blueprint $t): void {
            if (! $this->indexExists('users', 'users_last_login_at_idx')) {
                $t->index('last_login_at', 'users_last_login_at_idx');
            }
        });

        // --- customers / employees -------------------------------------
        // Cross-tenant COUNT — single-column tenant_id index helps the
        // optimiser pick a smaller index for COUNT scans.
        Schema::table('customers', function (Blueprint $t): void {
            if (! $this->indexExists('customers', 'customers_created_at_idx')) {
                $t->index('created_at', 'customers_created_at_idx');
            }
        });

        // --- audit_logs ------------------------------------------------
        // Already has severity_created_idx. Add action+severity combo
        // for filtered audit views.
        Schema::table('audit_logs', function (Blueprint $t): void {
            if (! $this->indexExists('audit_logs', 'audit_logs_action_severity_idx')) {
                $t->index(['action', 'severity', 'created_at'], 'audit_logs_action_severity_idx');
            }
        });
    }

    public function down(): void
    {
        // We intentionally don't drop these — they're additive, perf-only,
        // and removing them would regress the dashboard. If you need to
        // roll back, drop the index manually via `DROP INDEX ... ON ...`.
    }

    private function indexExists(string $table, string $name): bool
    {
        $rows = \DB::select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
            [$table, $name],
        );

        return ! empty($rows);
    }
};
