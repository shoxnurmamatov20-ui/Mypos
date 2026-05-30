<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Visit-tokens: short-lived one-time codes a CEO/staff member mints for a
 * guest dining at a table (optionally scoped to zone and specific table).
 * The guest uses the raw token to leave verified feedback for that visit —
 * only the sha256 HMAC is stored server-side, so a DB leak does not expose
 * any live tokens. Mirrors the ShifoReyting feedback-token model.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('visit_tokens', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('table_category_id')->nullable()->constrained('table_categories')->nullOnDelete();
            $table->foreignUuid('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->index();
            $table->string('token_hash', 64)->unique();
            $table->string('visit_reference', 255)->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'expires_at']);
            $table->index(['tenant_id', 'table_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_tokens');
    }
};
