<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\ShiftBreak;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StartBreakAction
{
    /**
     * Start a break inside the employee's active (open) shift.
     *
     * @param  array{reason?: string|null, notes?: string|null}  $options
     */
    public function __invoke(Employee $employee, array $options = []): ShiftBreak
    {
        return DB::transaction(function () use ($employee, $options): ShiftBreak {
            $shift = Shift::query()
                ->where('employee_id', $employee->id)
                ->whereIn('status', [ShiftStatus::Open->value, 'in_progress'])
                ->orderByDesc('actual_start')
                ->first();

            if ($shift === null) {
                throw ValidationException::withMessages([
                    'shift' => [__('Tanaffus boshlash uchun ochiq smena yo\'q')],
                ]);
            }

            $existing = ShiftBreak::query()
                ->where('shift_id', $shift->id)
                ->whereNull('ended_at')
                ->first();

            if ($existing !== null) {
                throw new HttpResponseException(response()->json([
                    'message' => __('Tanaffus allaqachon boshlangan'),
                    'errors' => ['shift' => [__('Tugatilmagan tanaffus mavjud')]],
                ], 409));
            }

            return ShiftBreak::create([
                'tenant_id' => $employee->tenant_id,
                'shift_id' => $shift->id,
                'employee_id' => $employee->id,
                'started_at' => now(),
                'reason' => $options['reason'] ?? null,
                'notes' => $options['notes'] ?? null,
            ]);
        });
    }
}
