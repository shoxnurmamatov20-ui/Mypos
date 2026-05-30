<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Demo CEO user + 5 sample tenants.
 *
 * Login: ceo@mypos.uz / ceo123 (Phone + password via web-portal)
 * After login → web-portal redirects to web-ceo (port 3001) with cross-tenant KPIs.
 *
 * Idempotent: re-runnable without duplicating data.
 */
class DemoCeoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure CEO user exists.
        $ceo = User::query()->firstOrCreate(
            ['email' => 'ceo@mypos.uz'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Demo CEO (Yoqubjon Direktor)',
                'phone' => '+998901112233',
                'locale' => 'uz',
                'password' => Hash::make('ceo123'),
                'is_super_admin' => false,
                'email_verified_at' => now(),
            ],
        );

        // 2. Assign the `ceo` role under the Sanctum guard (used by API auth).
        if (! $ceo->hasRole(RoleEnum::Ceo->value)) {
            $ceo->assignRole(RoleEnum::Ceo->value);
        }

        // 3. Create or fetch 5 sample tenants for this CEO.
        $samples = [
            ['slug' => 'jome-burger', 'name' => 'Jome Burger',     'tier' => 'plus',  'plan' => 'plus'],
            ['slug' => 'lavash-house', 'name' => 'Lavash House',   'tier' => 'pro',   'plan' => 'pro'],
            ['slug' => 'choyxona',     'name' => 'Choyxona',       'tier' => 'free',  'plan' => 'free'],
            ['slug' => 'pizza-time',   'name' => 'Pizza Time',     'tier' => 'pro',   'plan' => 'pro'],
            ['slug' => 'samarkand',    'name' => 'Samarkand Osh',  'tier' => 'plus',  'plan' => 'plus'],
        ];

        foreach ($samples as $i => $row) {
            $tenant = Tenant::query()->firstOrCreate(
                ['slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'plan' => $row['plan'],
                    'subscription_plan' => $row['plan'],
                    'subscription_status' => 'active',
                    'status' => 'active',
                    'tier' => $row['tier'],
                    'default_locale' => 'uz',
                    'default_currency' => 'UZS',
                    'timezone' => 'Asia/Tashkent',
                    'mrr_minor' => match ($row['plan']) {
                        'plus' => 300_000_00,
                        'pro' => 90_000_00,
                        default => 0,
                    },
                    'total_revenue_minor' => random_int(5_000_000_00, 50_000_000_00),
                ],
            );

            // 4. Link CEO to the tenant via `tenant_owners` pivot (idempotent).
            DB::table('tenant_owners')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'user_id' => $ceo->id],
                [
                    'id' => (string) Str::uuid(),
                    'is_primary' => $i === 0,
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $this->command?->info(sprintf(
            'Demo CEO ready: ceo@mypos.uz / ceo123 (owns %d tenants)',
            count($samples),
        ));
    }
}
