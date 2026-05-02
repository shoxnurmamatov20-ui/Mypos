<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Enums\TenantPlan;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
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

            // Generate a fresh random password each seed run (no hardcoded creds).
            // Echoed once so the developer can copy it from the console output.
            $ownerExisted = User::where('email', 'owner@demo.mypos.uz')->exists();
            $ownerPassword = Str::random(24);

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

            if (! $ownerExisted) {
                $this->command?->info("Demo owner created: owner@demo.mypos.uz / {$ownerPassword}");
            } else {
                $this->command?->info('Demo owner already existed; password unchanged.');
            }

            if (! $owner->hasRole(RoleEnum::Owner->value)) {
                $owner->assignRole(RoleEnum::Owner->value);
            }
        });
    }
}
