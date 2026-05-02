<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\ShiftBreak;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ShiftBreak> */
class ShiftBreakFactory extends Factory
{
    protected $model = ShiftBreak::class;

    public function definition(): array
    {
        return [
            'tenant_id' => function (array $attrs): string {
                if (isset($attrs['employee_id'])) {
                    /** @var Employee|null $emp */
                    $emp = Employee::withoutGlobalScopes()->find($attrs['employee_id']);
                    if ($emp !== null) {
                        return $emp->tenant_id;
                    }
                }
                return Employee::factory()->create()->tenant_id;
            },
            'shift_id' => Shift::factory(),
            'employee_id' => Employee::factory(),
            'started_at' => now()->subMinutes(15),
            'ended_at' => null,
            'duration_minutes' => null,
            'reason' => 'rest',
            'notes' => null,
        ];
    }

    public function ended(): static
    {
        return $this->state(fn (array $attrs) => [
            'ended_at' => now(),
            'duration_minutes' => 15,
        ]);
    }
}
