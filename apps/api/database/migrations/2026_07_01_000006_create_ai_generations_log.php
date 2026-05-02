<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4 — AI usage audit log.
 *
 * Every call MyPOS makes to an LLM (Claude, GPT-4, Gemini, local Ollama)
 * gets logged here for:
 *
 *   1. Cost tracking — per-tenant invoicing of "AI add-on" tier.
 *   2. Debugging — when a customer complains "the menu generator gave me
 *      garbage", we have the exact prompt + response.
 *   3. Rate-limit enforcement — count rows per tenant per minute to throttle.
 *   4. Quality monitoring — sample success vs error vs rate_limited rates.
 *   5. Pre-tenant abuse control — public onboarding wizard logs by ip_address
 *      since no tenant_id exists yet.
 *
 * Schema notes:
 *   - PK is UUID, not bigSerial. Spec preferred bigSerial for write throughput
 *     but Agent E2 already shipped {@see App\Domain\AI\Models\AiGenerationLog}
 *     using HasUuids. Aligning here is mandatory because that model is the
 *     write path. Documented as a tracked deviation from spec.
 *   - tenant_id NULLABLE — public onboarding endpoint logs pre-tenant.
 *   - user_id NULLABLE BIGINT references users.id (system-initiated jobs
 *     get NULL).
 *   - ip_address NULLABLE — extra column beyond spec, required by E2's
 *     AnthropicClient for abuse tracking on the public onboarding endpoint.
 *   - Full timestamps (created_at + updated_at) — E2's model assumes them.
 *     Append-only in practice; updated_at is just there because Eloquent
 *     errors out without it on save() for non-`HasNoUpdatedAt` models.
 *
 * RLS: standard tenant_isolation pattern with super-admin '*' bypass and
 * NULL-tenant rows visible (public onboarding endpoint writes them).
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('ai_generations_log')) {
            return;
        }

        Schema::create('ai_generations_log', function (Blueprint $table): void {
            // UUID PK to match E2's HasUuids model.
            $table->uuid('id')->primary();

            // Nullable: platform-level + pre-tenant onboarding calls.
            $table->uuid('tenant_id')->nullable();

            // Nullable: system-initiated jobs have no user.
            // BIGINT (matches users.id which is bigint, NOT users.uuid).
            $table->unsignedBigInteger('user_id')->nullable();

            // Feature category — discrete enum-like values driven by
            // App\Domain\AI\Enums\AiFeature. 64 chars matches E2's column
            // length (slugs like 'menu_generator', 'demand_forecast').
            $table->string('feature', 64);

            // Model identifier — vendor-prefixed string like
            // 'claude-opus-4-7' or 'gpt-4o-mini'.
            $table->string('model', 64);

            // Token counts. unsignedInteger matches E2's model. Default 0
            // because failure rows still need numeric columns (no NULL token
            // counts to special-case in dashboards).
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);

            // Cost accounting in USD with micro-cent precision. Default 0
            // (not NULL) so SUM() in cost dashboards never returns NULL.
            //   max value: 9999.999999 — we'd never have a single call
            //              that expensive, but the headroom is free.
            $table->decimal('cost_usd', 10, 6)->default(0);

            // Outcome bucket. App\Domain\AI\Enums\AiGenerationStatus drives:
            //   'success' | 'error' | 'rate_limited'
            $table->string('status', 16)->default('success');

            // Truncated error string when status='error'. TEXT is fine —
            // these rows are not query-hot and provider error messages
            // can be long.
            $table->text('error_message')->nullable();

            // Wall-clock latency in milliseconds. Useful for SLO tracking.
            // Default 0 (not nullable) for the same reason as token counts.
            $table->unsignedInteger('duration_ms')->default(0);

            // Sanitized request/response payloads. JSONB so we can:
            //   - filter ("show me all calls where temperature > 0.7")
            //   - GIN-index later if query volume justifies it
            // Nullable here (vs default '{}') because E2's model uses array
            // cast which round-trips NULL just fine, and for failure rows
            // we sometimes have no response payload at all.
            $table->jsonb('request_payload')->nullable();
            $table->jsonb('response_payload')->nullable();

            // IPv4 / IPv6 max length 45 chars. Used by the public onboarding
            // endpoint for abuse tracking before any tenant exists.
            $table->string('ip_address', 45)->nullable();

            // Full timestamps. Eloquent's HasUuids model expects updated_at
            // even though rows are effectively append-only.
            $table->timestamps();
        });

        // Foreign keys. NullOnDelete on user_id so deleting a user keeps the
        // audit trail. CascadeOnDelete on tenant_id matches the rest of the
        // schema — tenant gone = their AI logs gone (also legally correct
        // for GDPR-style "right to be forgotten" requests).
        Schema::table('ai_generations_log', function (Blueprint $table): void {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });

        // Indexes — tuned to the common query patterns:
        //   - "Recent AI activity for THIS tenant"     → (tenant_id, created_at DESC)
        //   - "Cross-tenant feature usage analytics"   → (feature, created_at DESC)
        //   - "Abuse rate-limit by IP"                 → (ip_address, created_at DESC)
        //   - "Errors today" badge                     → (status, created_at DESC)
        //
        // Use raw SQL for DESC ordering on PostgreSQL (Laravel's Blueprint
        // doesn't expose index column direction).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('
                CREATE INDEX IF NOT EXISTS ai_generations_log_tenant_idx
                ON ai_generations_log (tenant_id, created_at DESC)
            ');
            DB::statement('
                CREATE INDEX IF NOT EXISTS ai_generations_log_feature_idx
                ON ai_generations_log (feature, created_at DESC)
            ');
            DB::statement('
                CREATE INDEX IF NOT EXISTS ai_generations_log_ip_idx
                ON ai_generations_log (ip_address, created_at DESC)
            ');
            DB::statement('
                CREATE INDEX IF NOT EXISTS ai_generations_log_status_idx
                ON ai_generations_log (status, created_at DESC)
            ');

            // RLS — tenant isolation. Allow rows where tenant_id IS NULL to
            // be readable / writable so the public onboarding endpoint (no
            // tenant context yet) can record its calls. Super admin '*'
            // bypass for cross-tenant cost dashboards.
            DB::statement('ALTER TABLE ai_generations_log ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_ai_generations_log ON ai_generations_log');
            DB::statement("
                CREATE POLICY tenant_isolation_ai_generations_log ON ai_generations_log
                USING (
                    tenant_id IS NULL
                    OR tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
                WITH CHECK (
                    tenant_id IS NULL
                    OR tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
            ");
        } else {
            // SQLite/MySQL fallback — non-DESC indexes; tests will work.
            Schema::table('ai_generations_log', function (Blueprint $table): void {
                $table->index(['tenant_id', 'created_at'], 'ai_generations_log_tenant_idx');
                $table->index(['feature', 'created_at'], 'ai_generations_log_feature_idx');
                $table->index(['ip_address', 'created_at'], 'ai_generations_log_ip_idx');
                $table->index(['status', 'created_at'], 'ai_generations_log_status_idx');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('ai_generations_log')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_ai_generations_log ON ai_generations_log');
            DB::statement('ALTER TABLE ai_generations_log DISABLE ROW LEVEL SECURITY');
            DB::statement('DROP INDEX IF EXISTS ai_generations_log_status_idx');
            DB::statement('DROP INDEX IF EXISTS ai_generations_log_ip_idx');
            DB::statement('DROP INDEX IF EXISTS ai_generations_log_feature_idx');
            DB::statement('DROP INDEX IF EXISTS ai_generations_log_tenant_idx');
        }

        Schema::dropIfExists('ai_generations_log');
    }
};
