<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'super_admin_role')) {
                // owner | admin | support | finance | developer
                $table->string('super_admin_role', 32)->nullable();
            }
            if (! Schema::hasColumn('users', 'last_super_admin_login_at')) {
                $table->timestamp('last_super_admin_login_at')->nullable();
            }
            if (! Schema::hasColumn('users', 'mfa_enabled')) {
                $table->boolean('mfa_enabled')->default(false);
            }
            if (! Schema::hasColumn('users', 'mfa_secret')) {
                // Encrypted TOTP secret — null until MFA enabled
                $table->string('mfa_secret', 255)->nullable();
            }
        });

        // Useful for "who is allowed to manage X" lookups across all users
        if (Schema::hasColumn('users', 'super_admin_role')) {
            Schema::table('users', function (Blueprint $table) {
                try {
                    $table->index('super_admin_role', 'users_super_admin_role_idx');
                } catch (\Throwable $e) {
                    // ignore — index may already exist
                }
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            try {
                $table->dropIndex('users_super_admin_role_idx');
            } catch (\Throwable $e) {
                // ignore
            }

            $columns = array_filter([
                Schema::hasColumn('users', 'mfa_secret') ? 'mfa_secret' : null,
                Schema::hasColumn('users', 'mfa_enabled') ? 'mfa_enabled' : null,
                Schema::hasColumn('users', 'last_super_admin_login_at') ? 'last_super_admin_login_at' : null,
                Schema::hasColumn('users', 'super_admin_role') ? 'super_admin_role' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
