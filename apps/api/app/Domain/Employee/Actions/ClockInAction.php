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

class ClockInAction
{
    /**
     * Start (or attach to) an employee shift and log a clock-in event.
     *
     * @param  array{source?: string, shift_id?: string|null, metadata?: array<string, mixed>|null}  $options
     */
    public function __invoke(Employee $employee, array $options = []): Shift
    {
        return DB::transaction(function () use ($employee, $options): Shift {
            $now = Carbon::now();
            $source = $options['source'] ?? 'manual';

            /** @var Shift|null $shift */
            $shift = null;
            if (! empty($options['shift_id'])) {
                $shift = Shift::query()
                    ->where('employee_id', $employee->id)
                    ->where('id', $options['shift_id'])
                    ->first();
            }

            if ($shift === null) {
                $shift = Shift::query()
                    ->where('employee_id', $employee->id)
                    ->where('status', ShiftStatus::Scheduled->value)
                    ->whereBetween('scheduled_start', [
                        $now->copy()->subHours(4),
                        $now->copy()->addHours(4),
                    ])
                    ->orderBy('scheduled_start')
                    ->first();
            }

            if ($shift === null) {
                $shift = Shift::create([
                    'tenant_id' => $employee->tenant_id,
                    'employee_id' => $employee->id,
                    'scheduled_start' => $now,
                    'scheduled_end' => $now->copy()->addHours(8),
                    'actual_start' => $now,
                    'status' => ShiftStatus::Open->value,
                ]);
            } else {
                $shift->update([
                    'actual_start' => $shift->actual_start ?? $now,
                    'status' => ShiftStatus::Open->value,
                ]);
            }

            TimeClockEvent::create([
                'tenant_id' => $employee->tenant_id,
                'shift_id' => $shift->id,
                'employee_id' => $employee->id,
                'event_type' => ClockEventType::ClockIn->value,
                'recorded_at' => $now,
                'source' => $source,
                'metadata' => $options['metadata'] ?? null,
            ]);

            return $shift->fresh(['employee.user']);
        });
    }
}
