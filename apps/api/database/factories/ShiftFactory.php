<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Shift> */
class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-30 days', '+7 days');
        $end = (clone $start)->modify('+8 hours');

        return [
            'tenant_id' => function (array $attrs): string {
                if (isset($attrs['employee_id'])) {
                    /** @var Employee|null $employee */
                    $employee = Employee::withoutGlobalScopes()->find($attrs['employee_id']);
                    if ($employee !== null) {
                        return $employee->tenant_id;
                    }
                }
                return Employee::factory()->create()->tenant_id;
            },
            'employee_id' => Employee::factory(),
            'scheduled_start' => $start,
            'scheduled_end' => $end,
            'actual_start' => null,
            'actual_end' => null,
            'status' => ShiftStatus::Scheduled->value,
            'notes' => null,
        ];
    }

    public function open(): static
    {
        return $this->state(fn (array $attrs) => [
            'actual_start' => $attrs['scheduled_start'],
            'status' => ShiftStatus::Open->value,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attrs) => [
            'actual_start' => $attrs['scheduled_start'],
            'actual_end' => $attrs['scheduled_end'],
            'status' => ShiftStatus::Closed->value,
        ]);
    }
}
