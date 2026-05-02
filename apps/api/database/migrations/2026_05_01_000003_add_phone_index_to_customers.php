<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Prepare schema for PII-at-rest encryption (CLAUDE.md §7).
 *
 * 1. Add `phone_index` (HMAC-SHA256(app.key, normalised_phone)) to `customers`
 *    and `users` so equality lookups stay O(log n) once `phone` becomes an
 *    AES-CBC ciphertext (different per save → useless for indexing).
 * 2. Widen PII columns to TEXT — Laravel's `encrypted` cast emits a
 *    base64-wrapped JSON envelope (`eyJpdiI6...`) ~150–500 chars, which
 *    overflows VARCHAR(32)/(128)/(256).
 * 3. Drop legacy plaintext-equality unique constraints / indexes that no
 *    longer serve a purpose (replaced by `phone_index`).
 *
 * NOTE: Re-encryption of existing rows is performed by the *next* migration
 *       (`2026_05_01_000004_encrypt_existing_pii_data`).
 */
return new class extends Migration {
    public function up(): void
    {
        // ── customers ────────────────────────────────────────────────────
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table): void {
                if (! Schema::hasColumn('customers', 'phone_index')) {
                    $table->string('phone_index', 64)
                        ->nullable()
                        ->after('phone');
                }
            });

            // Drop legacy constraints (best-effort; ignore if already gone).
            try {
                Schema::table('customers', function (Blueprint $table): void {
                    $table->dropUnique(['tenant_id', 'phone']);
                });
            } catch (\Throwable $e) {
                // already dropped or never existed
            }
            try {
                Schema::table('customers', function (Blueprint $table): void {
                    $table->dropIndex(['tenant_id', 'email']);
                });
            } catch (\Throwable $e) {
                // already dropped or never existed
            }

            // Widen plaintext-sized columns to TEXT to fit ciphertext.
            if (DB::connection()->getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE customers ALTER COLUMN phone TYPE TEXT');
                DB::statement('ALTER TABLE customers ALTER COLUMN email TYPE TEXT');
                // notes is already TEXT; nothing to widen.
            } else {
                Schema::table('customers', function (Blueprint $table): void {
                    $table->text('phone')->change();
                    $table->text('email')->nullable()->change();
                });
            }

            Schema::table('customers', function (Blueprint $table): void {
                $table->index('phone_index', 'customers_phone_index_idx');
                $table->unique(['tenant_id', 'phone_index'], 'customers_tenant_phone_index_uq');
            });
        }

        // ── users (preparatory only — User.phone stays plaintext for now) ─
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'phone_index')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('phone_index', 64)
                    ->nullable()
                    ->after('phone');
                $table->index('phone_index', 'users_phone_index_idx');
            });
        }

        // ── orders ──────────────────────────────────────────────────────
        if (Schema::hasTable('orders')) {
            if (DB::connection()->getDriverName() === 'pgsql') {
                if (Schema::hasColumn('orders', 'delivery_phone')) {
                    DB::statement('ALTER TABLE orders ALTER COLUMN delivery_phone TYPE TEXT');
                }
                if (Schema::hasColumn('orders', 'customer_phone_for_receipt')) {
                    DB::statement('ALTER TABLE orders ALTER COLUMN customer_phone_for_receipt TYPE TEXT');
                }
                // delivery_address is jsonb today; ciphertext is opaque
                // (no JSON operators apply post-encryption) → convert to TEXT.
                if (Schema::hasColumn('orders', 'delivery_address')) {
                    DB::statement(
                        'ALTER TABLE orders ALTER COLUMN delivery_address TYPE TEXT '
                        . 'USING delivery_address::text'
                    );
                }
            } else {
                Schema::table('orders', function (Blueprint $table): void {
                    if (Schema::hasColumn('orders', 'delivery_phone')) {
                        $table->text('delivery_phone')->nullable()->change();
                    }
                    if (Schema::hasColumn('orders', 'customer_phone_for_receipt')) {
                        $table->text('customer_phone_for_receipt')->nullable()->change();
                    }
                    if (Schema::hasColumn('orders', 'delivery_address')) {
                        $table->text('delivery_address')->nullable()->change();
                    }
                });
            }
        }

        // ── notifications_log ───────────────────────────────────────────
        if (Schema::hasTable('notifications_log')) {
            if (DB::connection()->getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE notifications_log ALTER COLUMN recipient TYPE TEXT');
                // body is already TEXT.
            } else {
                Schema::table('notifications_log', function (Blueprint $table): void {
                    $table->text('recipient')->change();
                });
            }
        }
    }

    public function down(): void
    {
        // ── notifications_log ───────────────────────────────────────────
        if (Schema::hasTable('notifications_log') && DB::connection()->getDriverName() === 'pgsql') {
            try {
                DB::statement('ALTER TABLE notifications_log ALTER COLUMN recipient TYPE VARCHAR(256)');
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // ── orders ──────────────────────────────────────────────────────
        if (Schema::hasTable('orders') && DB::connection()->getDriverName() === 'pgsql') {
            try {
                if (Schema::hasColumn('orders', 'delivery_phone')) {
                    DB::statement('ALTER TABLE orders ALTER COLUMN delivery_phone TYPE VARCHAR(32)');
                }
                if (Schema::hasColumn('orders', 'customer_phone_for_receipt')) {
                    DB::statement('ALTER TABLE orders ALTER COLUMN customer_phone_for_receipt TYPE VARCHAR(32)');
                }
                if (Schema::hasColumn('orders', 'delivery_address')) {
                    DB::statement(
                        'ALTER TABLE orders ALTER COLUMN delivery_address TYPE JSONB '
                        . 'USING NULLIF(delivery_address, \'\')::jsonb'
                    );
                }
            } catch (\Throwable $e) {
                // ignore (data may not roundtrip)
            }
        }

        // ── users ───────────────────────────────────────────────────────
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'phone_index')) {
            Schema::table('users', function (Blueprint $table): void {
                try { $table->dropIndex('users_phone_index_idx'); } catch (\Throwable $e) {}
                $table->dropColumn('phone_index');
            });
        }

        // ── customers ───────────────────────────────────────────────────
        if (Schema::hasTable('customers')) {
            if (Schema::hasColumn('customers', 'phone_index')) {
                Schema::table('customers', function (Blueprint $table): void {
                    try { $table->dropUnique('customers_tenant_phone_index_uq'); } catch (\Throwable $e) {}
                    try { $table->dropIndex('customers_phone_index_idx'); } catch (\Throwable $e) {}
                    $table->dropColumn('phone_index');
                });
            }

            if (DB::connection()->getDriverName() === 'pgsql') {
                try {
                    DB::statement('ALTER TABLE customers ALTER COLUMN phone TYPE VARCHAR(32)');
                    DB::statement('ALTER TABLE customers ALTER COLUMN email TYPE VARCHAR(128)');
                } catch (\Throwable $e) {
                    // ignore (ciphertext won't fit back into plaintext widths)
                }
            }

            try {
                Schema::table('customers', function (Blueprint $table): void {
                    $table->unique(['tenant_id', 'phone']);
                    $table->index(['tenant_id', 'email']);
                });
            } catch (\Throwable $e) {
                // ignore
            }
        }
    }
};
