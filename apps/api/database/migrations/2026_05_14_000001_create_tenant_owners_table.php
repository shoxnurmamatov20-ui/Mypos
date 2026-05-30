<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-tenant ownership pivot.
 *
 * A "CEO" / business owner (Role::Ceo) can own multiple restaurants. This
 * table maps them. A user with this role sees a consolidated dashboard
 * (web-ceo @ port 3001) across all their owned tenants.
 *
 * Compared to `users.tenant_id` (single-tenant scope used by Owner/Manager
 * roles), this pivot supports many-to-many. A single user can be CEO of
 * tenants A, B, C while also being Owner of tenant A directly.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_owners', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id'], 'tenant_owners_unique');
            $table->index('user_id', 'tenant_owners_user_id_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_owners');
    }
};
