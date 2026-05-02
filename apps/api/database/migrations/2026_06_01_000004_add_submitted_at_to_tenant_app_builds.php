<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — adds `submitted_at` to `tenant_app_builds`.
 *
 * The original migration only stored `submitted_at` on `tenant_apps` (the
 * "current submission" pointer), but the SubmitToStoreJob tracks per-build
 * submission timestamps for audit history. Adding the column here so the
 * build row carries its own timestamp independently of the parent app.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        Schema::table('tenant_app_builds', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenant_app_builds', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('finished_at');
            }
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        Schema::table('tenant_app_builds', function (Blueprint $table): void {
            if (Schema::hasColumn('tenant_app_builds', 'submitted_at')) {
                $table->dropColumn('submitted_at');
            }
        });
    }
};
