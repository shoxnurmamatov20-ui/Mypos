<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Employee> */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        $positions = [
            Role::Manager->value,
            Role::Cashier->value,
            Role::Waiter->value,
            Role::Chef->value,
            Role::Courier->value,
        ];

        return [
            'tenant_id' => Tenant::factory(),
            'user_uuid' => function (array $attributes): string {
                $user = User::factory()->create([
                    'tenant_id' => $attributes['tenant_id'] ?? null,
                ]);
                return $user->uuid;
            },
            'employee_code' => 'EMP-' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'position' => fake()->randomElement($positions),
            'hire_date' => fake()->dateTimeBetween('-3 years', 'now')->format('Y-m-d'),
            'base_salary' => fake()->numberBetween(3_000_000, 15_000_000),
            'hourly_rate' => fake()->numberBetween(20_000, 80_000),
            'status' => EmployeeStatus::Active->value,
            'notes' => null,
            'emergency_contact' => fake()->phoneNumber(),
            'documents' => null,
        ];
    }

    public function manager(): static
    {
        return $this->state(fn () => ['position' => Role::Manager->value]);
    }

    public function cashier(): static
    {
        return $this->state(fn () => ['position' => Role::Cashier->value]);
    }

    public function terminated(): static
    {
        return $this->state(fn () => [
            'status' => EmployeeStatus::Terminated->value,
            'terminated_at' => now(),
        ]);
    }
}
