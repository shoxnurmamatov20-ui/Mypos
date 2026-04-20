<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Enums\ClockEventType;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\TimeClockEvent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClockOutAction
{
    /**
     * Close the employee's active (open) shift and log a clock-out event.
     *
     * @param  array{source?: string, metadata?: array<string, mixed>|null}  $options
     */
    public function __invoke(Employee $employee, array $options = []): Shift
    {
        return DB::transaction(function () use ($employee, $options): Shift {
            $now = Carbon::now();
            $source = $options['source'] ?? 'manual';

            /** @var Shift|null $shift */
            $shift = Shift::query()
                ->where('employee_id', $employee->id)
                ->where('status', ShiftStatus::Open->value)
                ->orderByDesc('actual_start')
                ->first();

            if ($shift === null) {
                throw ValidationException::withMessages([
                    'shift' => ['Ochiq smena topilmadi'],
                ]);
            }

            $shift->update([
                'actual_end' => $now,
                'status' => ShiftStatus::Closed->value,
            ]);

            TimeClockEvent::create([
                'tenant_id' => $employee->tenant_id,
                'shift_id' => $shift->id,
                'employee_id' => $employee->id,
                'event_type' => ClockEventType::ClockOut->value,
                'recorded_at' => $now,
                'source' => $source,
                'metadata' => $options['metadata'] ?? null,
            ]);

            return $shift->fresh(['employee.user']);
        });
    }
}
