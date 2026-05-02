<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — Native App Builder.
 *
 * Build history — one row per EAS Build invocation. Append-only from the
 * application's perspective (status fields are mutated by EAS webhooks; rows
 * themselves are never deleted, only the parent tenant_app cascade can prune).
 *
 * Two separate state machines on each row:
 *
 *   `status`            — EAS Build pipeline:
 *     queued → in-progress → finished
 *                          ↘ failed | errored | canceled
 *
 *   `submission_status` — Post-build store lifecycle:
 *     pending → submitted → in_review → approved
 *                                      ↘ rejected
 *
 * The split lets us list "all completed builds awaiting submission" or "all
 * builds rejected by Apple in the last 30 days" without disambiguating the
 * source of the verdict.
 *
 * `tenant_id` is duplicated (also reachable via tenant_apps.tenant_id) so RLS
 * can scope without a JOIN — keeping the policy a simple `tenant_id = ...`.
 *
 * Indexes are tuned for the dashboard's two main queries:
 *   - "all builds for one app, newest first" → (tenant_app_id, created_at DESC)
 *     covered by tenant_app_builds_app_idx + tenant_app_builds_created_idx.
 *   - "lookup by EAS webhook payload" → eas_build_id (partial: only set rows).
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('tenant_app_builds')) {
            return;
        }

        Schema::create('tenant_app_builds', function (Blueprint $table): void {
            $table->uuid('id')->primary();

            // Duplicated for RLS-friendliness — see class docblock.
            $table->uuid('tenant_id');
            $table->uuid('tenant_app_id');

            // 'ios' | 'android' (no 'universal' here — EAS produces one
            // artifact per platform even for shared configs).
            $table->string('platform', 16);

            // ----- EAS Build correlation -----------------------------------
            // External UUID issued by EAS on dispatch — webhook payloads
            // include this for matching. Nullable because the row is created
            // before the API call returns (so a network failure doesn't lose
            // the audit trail).
            $table->string('eas_build_id', 64)->nullable();
            $table->string('eas_project_id', 64)->nullable();
            // 'production' | 'preview' | 'development'
            $table->string('build_profile', 32)->default('production');

            // ----- Status (EAS pipeline) -----------------------------------
            // 'queued' | 'in-progress' | 'finished' | 'failed' | 'errored'
            //   | 'canceled'
            $table->string('status', 32)->default('queued');

            // ----- Submission status (post-build store flow) ---------------
            // 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected'
            $table->string('submission_status', 32)->default('pending');

            // ----- Artifact URLs (MinIO mirrors of EAS-hosted artifacts) ---
            // Final IPA / AAB. We mirror to MinIO because EAS retention is
            // 30 days on the free tier; we want indefinite for support.
            $table->string('artifact_url', 512)->nullable();
            // Build log — useful for debugging failed builds without
            // round-tripping to the EAS dashboard.
            $table->string('log_url', 512)->nullable();
            // Internal-test install QR code (TestFlight / Play internal).
            $table->string('qr_code_url', 512)->nullable();

            // ----- Versioning ----------------------------------------------
            // Snapshotted from tenant_apps at dispatch time so the historical
            // record stays accurate even if the parent app's version is bumped.
            $table->string('version', 32);
            $table->integer('build_number');

            // ----- Outcome details -----------------------------------------
            // EAS or build-script error output.
            $table->text('error_message')->nullable();
            // Apple / Google reviewer feedback on rejection.
            $table->text('reviewer_notes')->nullable();

            // ----- Timing --------------------------------------------------
            $table->timestamps();
            // started_at: when EAS picks up the job from the queue.
            $table->timestamp('started_at')->nullable();
            // finished_at: terminal state reached (success OR failure).
            $table->timestamp('finished_at')->nullable();

            $table->index('tenant_id', 'tenant_app_builds_tenant_idx');
            $table->index('tenant_app_id', 'tenant_app_builds_app_idx');
            $table->index('status', 'tenant_app_builds_status_idx');
            // Composite for the dashboard's "newest builds for this tenant"
            // query — DESC ordering matters; PG ignores it for B-tree but it
            // documents intent for future readers.
            $table->index(['tenant_id', 'created_at'], 'tenant_app_builds_created_idx');
        });

        Schema::table('tenant_app_builds', function (Blueprint $table): void {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('tenant_app_id')
                ->references('id')
                ->on('tenant_apps')
                ->cascadeOnDelete();
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            // Partial index — only ~50% of rows ever populate eas_build_id
            // (queued rows haven't reached EAS yet on transient failures).
            DB::statement('
                CREATE INDEX IF NOT EXISTS tenant_app_builds_eas_idx
                ON tenant_app_builds (eas_build_id)
                WHERE eas_build_id IS NOT NULL
            ');

            // Row-Level Security — tenant isolation, super-admin '*' bypass.
            DB::statement('ALTER TABLE tenant_app_builds ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_app_builds ON tenant_app_builds');
            DB::statement("
                CREATE POLICY tenant_isolation_tenant_app_builds ON tenant_app_builds
                USING (
                    tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
                WITH CHECK (
                    tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
            ");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('tenant_app_builds')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_app_builds ON tenant_app_builds');
            DB::statement('ALTER TABLE tenant_app_builds DISABLE ROW LEVEL SECURITY');
            DB::statement('DROP INDEX IF EXISTS tenant_app_builds_eas_idx');
        }

        Schema::dropIfExists('tenant_app_builds');
    }
};
