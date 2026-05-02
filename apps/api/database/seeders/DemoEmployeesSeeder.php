<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoEmployeesSeeder extends Seeder
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

        $tenant = Tenant::where('slug', 'demo-restaurant')->first();
        if ($tenant === null) {
            $this->command?->warn('Demo tenant not found; skipping employees seed.');
            return;
        }

        DB::transaction(function () use ($tenant): void {
            $roster = [
                [
                    'name' => 'Alisher Menejer',
                    'email' => 'manager@demo.mypos.uz',
                    'phone' => '+998901234001',
                    'position' => RoleEnum::Manager->value,
                    'code' => 'EMP-0001',
                    'base_salary' => 12_000_000,
                    'hourly_rate' => 75_000,
                ],
                [
                    'name' => 'Dilnoza Kassirova',
                    'email' => 'cashier1@demo.mypos.uz',
                    'phone' => '+998901234002',
                    'position' => RoleEnum::Cashier->value,
                    'code' => 'EMP-0002',
                    'base_salary' => 6_000_000,
                    'hourly_rate' => 35_000,
                ],
                [
                    'name' => 'Sanjar Kassirov',
                    'email' => 'cashier2@demo.mypos.uz',
                    'phone' => '+998901234003',
                    'position' => RoleEnum::Cashier->value,
                    'code' => 'EMP-0003',
                    'base_salary' => 6_000_000,
                    'hourly_rate' => 35_000,
                ],
                [
                    'name' => 'Bobur Oshpaz',
                    'email' => 'chef@demo.mypos.uz',
                    'phone' => '+998901234004',
                    'position' => RoleEnum::Chef->value,
                    'code' => 'EMP-0004',
                    'base_salary' => 9_000_000,
                    'hourly_rate' => 55_000,
                ],
                [
                    'name' => 'Nodira Ofitsiant',
                    'email' => 'waiter@demo.mypos.uz',
                    'phone' => '+998901234005',
                    'position' => RoleEnum::Waiter->value,
                    'code' => 'EMP-0005',
                    'base_salary' => 5_000_000,
                    'hourly_rate' => 30_000,
                ],
            ];

            $created = 0;
            foreach ($roster as $person) {
                // Generate a fresh random password each seed run (no hardcoded creds).
                $userExisted = User::where('email', $person['email'])->exists();
                $generatedPassword = Str::random(24);

                $user = User::firstOrCreate(
                    ['email' => $person['email']],
                    [
                        'name' => $person['name'],
                        'tenant_id' => $tenant->id,
                        'phone' => $person['phone'],
                        'locale' => 'uz',
                        'password' => Hash::make($generatedPassword),
                        'email_verified_at' => now(),
                        'is_super_admin' => false,
                    ],
                );

                if (! $userExisted) {
                    $this->command?->info("Demo employee created: {$person['email']} / {$generatedPassword}");
                }

                if (! $user->hasRole($person['position'])) {
                    $user->assignRole($person['position']);
                }

                /** @var Employee $employee */
                $employee = Employee::withoutGlobalScopes()->firstOrCreate(
                    ['tenant_id' => $tenant->id, 'employee_code' => $person['code']],
                    [
                        'user_uuid' => $user->uuid,
                        'position' => $person['position'],
                        'hire_date' => now()->subMonths(6)->toDateString(),
                        'base_salary' => $person['base_salary'],
                        'hourly_rate' => $person['hourly_rate'],
                        'status' => 'active',
                    ],
                );

                $this->seedShiftsFor($employee);
                $created++;
            }

            $this->command?->info("Seeded {$created} employees with 30 days of shifts.");
        });
    }

    private function seedShiftsFor(Employee $employee): void
    {
        for ($i = 30; $i >= 1; $i--) {
            $start = Carbon::now()->subDays($i)->setTime(9, 0, 0);
            $end = (clone $start)->addHours(8);

            $existing = Shift::withoutGlobalScopes()
                ->where('employee_id', $employee->id)
                ->whereBetween('scheduled_start', [
                    $start->copy()->subHour(),
                    $start->copy()->addHour(),
                ])
                ->exists();
            if ($existing) {
                continue;
            }

            Shift::create([
                'tenant_id' => $employee->tenant_id,
                'employee_id' => $employee->id,
                'scheduled_start' => $start,
                'scheduled_end' => $end,
                'actual_start' => $start->copy()->addMinutes(random_int(-5, 15)),
                'actual_end' => $end->copy()->addMinutes(random_int(-10, 20)),
                'status' => ShiftStatus::Closed->value,
            ]);
        }
    }
}
