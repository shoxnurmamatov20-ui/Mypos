<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Enums\TenantPlan;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Unit\Models\UnitOfMeasure;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn(static::class . ' refused to run outside local/testing environments.');
            return;
        }

        // Demo seeders run from artisan (no Auth user). Opt-in to lenient
        // BelongsToTenant scope so firstOrCreate lookups still see existing rows.
        BelongsToTenant::allowEmptyTenantContext();

        DB::transaction(function (): void {
            // Promote the initial Filament admin (created in tinker) to super admin.
            $superAdmin = User::where('email', 'admin@mypos.uz')->first();
            if ($superAdmin) {
                $superAdmin->update([
                    'is_super_admin' => true,
                    'locale' => 'uz',
                ]);
                if (! $superAdmin->hasRole(RoleEnum::SuperAdmin->value)) {
                    $superAdmin->assignRole(RoleEnum::SuperAdmin->value);
                }
            }

            // Create one demo tenant with an owner so we can exercise the app end-to-end.
            $tenant = Tenant::firstOrCreate(
                ['slug' => 'demo-restaurant'],
                [
                    'name' => 'Demo Restaurant',
                    'legal_name' => 'Demo Restaurant LLC',
                    'plan' => TenantPlan::Pro->value,
                    'status' => TenantStatus::Active->value,
                    'default_locale' => 'uz',
                    'default_currency' => 'UZS',
                    'timezone' => 'Asia/Tashkent',
                    'phone' => '+998901234567',
                    'email' => 'demo@mypos.uz',
                ],
            );

            // Stable demo password — only runs in local/testing (env guard above).
            // Matches the LoginForm demo button so /panel/portal/uz/login works
            // out-of-the-box. NEVER use in production.
            $ownerPassword = 'demo123';
            $ownerExisted = User::where('email', 'owner@demo.mypos.uz')->exists();

            $owner = User::firstOrCreate(
                ['email' => 'owner@demo.mypos.uz'],
                [
                    'name' => 'Demo Owner',
                    'tenant_id' => $tenant->id,
                    'locale' => 'uz',
                    'phone' => '+998901111111',
                    'password' => Hash::make($ownerPassword),
                    'email_verified_at' => now(),
                    'is_super_admin' => false,
                ],
            );

            // Re-affirm password on every seed so re-running fixes any drift.
            if ($ownerExisted) {
                $owner->password = Hash::make($ownerPassword);
                $owner->save();
            }

            $this->command?->info("Demo owner ready: owner@demo.mypos.uz / {$ownerPassword}");

            if (! $owner->hasRole(RoleEnum::Owner->value)) {
                $owner->assignRole(RoleEnum::Owner->value);
            }

            // Units of measure ("O'lchov birligi") — standard kg/litr/dona set,
            // tenant-scoped. Idempotent via firstOrCreate on (tenant_id, abbreviation).
            $units = [
                ['name' => 'Kilogramm', 'abbreviation' => 'kg', 'type' => 'weight', 'sort_order' => 1],
                ['name' => 'Gramm', 'abbreviation' => 'g', 'type' => 'weight', 'sort_order' => 2],
                ['name' => 'Litr', 'abbreviation' => 'l', 'type' => 'volume', 'sort_order' => 3],
                ['name' => 'Millilitr', 'abbreviation' => 'ml', 'type' => 'volume', 'sort_order' => 4],
                ['name' => 'Dona', 'abbreviation' => 'dona', 'type' => 'count', 'sort_order' => 5],
                ['name' => 'Portsiya', 'abbreviation' => 'port', 'type' => 'count', 'sort_order' => 6],
            ];

            foreach ($units as $unit) {
                UnitOfMeasure::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'abbreviation' => $unit['abbreviation']],
                    [
                        'name' => $unit['name'],
                        'type' => $unit['type'],
                        'is_active' => true,
                        'sort_order' => $unit['sort_order'],
                    ],
                );
            }

            $this->command?->info('Demo units of measure ready (kg, g, l, ml, dona, port).');
        });
    }
}
