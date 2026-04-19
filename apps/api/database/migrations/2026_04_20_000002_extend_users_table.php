<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add as nullable first — we'll backfill existing rows and then enforce NOT NULL.
            $table->uuid('uuid')->nullable()->after('id');
            $table->uuid('tenant_id')->nullable()->after('uuid');
            $table->string('phone', 32)->nullable()->unique()->after('email');
            $table->string('locale', 8)->default('uz')->after('phone');
            $table->string('avatar_url', 512)->nullable()->after('locale');
            $table->timestamp('last_login_at')->nullable()->after('avatar_url');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->boolean('is_super_admin')->default(false)->after('last_login_ip');
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->nullOnDelete();

            $table->index('tenant_id');
            $table->index('is_super_admin');
        });

        // Backfill UUIDs for any existing users.
        \Illuminate\Support\Facades\DB::table('users')
            ->whereNull('uuid')
            ->cursor()
            ->each(function ($user) {
                \Illuminate\Support\Facades\DB::table('users')
                    ->where('id', $user->id)
                    ->update(['uuid' => (string) \Illuminate\Support\Str::uuid()]);
            });

        // Now enforce NOT NULL + uniqueness.
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
            $table->unique('uuid');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn([
                'uuid', 'tenant_id', 'phone', 'locale', 'avatar_url',
                'last_login_at', 'last_login_ip', 'is_super_admin', 'deleted_at',
            ]);
        });
    }
};
