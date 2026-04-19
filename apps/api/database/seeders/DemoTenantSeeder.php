<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Tenant\Enums\TenantPlan;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
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

            $owner = User::firstOrCreate(
                ['email' => 'owner@demo.mypos.uz'],
                [
                    'name' => 'Demo Owner',
                    'tenant_id' => $tenant->id,
                    'locale' => 'uz',
                    'phone' => '+998901111111',
                    'password' => Hash::make('demo_owner_2026'),
                    'email_verified_at' => now(),
                    'is_super_admin' => false,
                ],
            );

            if (! $owner->hasRole(RoleEnum::Owner->value)) {
                $owner->assignRole(RoleEnum::Owner->value);
            }
        });
    }
}
