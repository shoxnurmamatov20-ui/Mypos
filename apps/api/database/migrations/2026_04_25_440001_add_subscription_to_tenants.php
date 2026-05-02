<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        // 1) Add columns (defensive — guard each one)
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'subscription_plan')) {
                // free | starter | pro | business | enterprise
                $table->string('subscription_plan', 32)->default('free');
            }
            if (! Schema::hasColumn('tenants', 'subscription_status')) {
                // active | trialing | past_due | suspended | cancelled
                $table->string('subscription_status', 32)->default('active');
            }
            if (! Schema::hasColumn('tenants', 'mrr_minor')) {
                // Monthly Recurring Revenue in so'm (denormalized minor units)
                $table->integer('mrr_minor')->default(0);
            }
            // Note: trial_ends_at + suspended_at already exist on tenants — guarded below.
            if (! Schema::hasColumn('tenants', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'subscription_ends_at')) {
                $table->timestamp('subscription_ends_at')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'suspension_reason')) {
                $table->string('suspension_reason', 255)->nullable();
            }
            if (! Schema::hasColumn('tenants', 'last_active_at')) {
                $table->timestamp('last_active_at')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'total_orders_count')) {
                // Denormalized for fast cross-tenant sorting
                $table->integer('total_orders_count')->default(0);
            }
            if (! Schema::hasColumn('tenants', 'total_revenue_minor')) {
                // Denormalized lifetime revenue
                $table->bigInteger('total_revenue_minor')->default(0);
            }
            if (! Schema::hasColumn('tenants', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

        // 2) Indexes — only after columns exist
        if (
            Schema::hasColumn('tenants', 'subscription_plan')
            && Schema::hasColumn('tenants', 'subscription_status')
        ) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->index(
                    ['subscription_plan', 'subscription_status'],
                    'tenants_plan_status_idx'
                );
            });
        }
        if (Schema::hasColumn('tenants', 'suspended_at')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->index('suspended_at', 'tenants_suspended_at_idx');
            });
        }
        if (Schema::hasColumn('tenants', 'last_active_at')) {
            // DESC order for "active recently" sort (Postgres supports index direction)
            Schema::table('tenants', function (Blueprint $table) {
                $table->index('last_active_at', 'tenants_last_active_at_idx');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        Schema::table('tenants', function (Blueprint $table) {
            foreach (
                ['tenants_plan_status_idx', 'tenants_suspended_at_idx', 'tenants_last_active_at_idx']
                as $idx
            ) {
                try {
                    $table->dropIndex($idx);
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            $columns = array_filter([
                Schema::hasColumn('tenants', 'notes') ? 'notes' : null,
                Schema::hasColumn('tenants', 'total_revenue_minor') ? 'total_revenue_minor' : null,
                Schema::hasColumn('tenants', 'total_orders_count') ? 'total_orders_count' : null,
                Schema::hasColumn('tenants', 'last_active_at') ? 'last_active_at' : null,
                Schema::hasColumn('tenants', 'suspension_reason') ? 'suspension_reason' : null,
                Schema::hasColumn('tenants', 'subscription_ends_at') ? 'subscription_ends_at' : null,
                Schema::hasColumn('tenants', 'mrr_minor') ? 'mrr_minor' : null,
                Schema::hasColumn('tenants', 'subscription_status') ? 'subscription_status' : null,
                Schema::hasColumn('tenants', 'subscription_plan') ? 'subscription_plan' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
