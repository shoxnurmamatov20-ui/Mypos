<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\ShiftBreak;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EndBreakAction
{
    /**
     * End the employee's currently-open break.
     */
    public function __invoke(Employee $employee): ShiftBreak
    {
        return DB::transaction(function () use ($employee): ShiftBreak {
            $break = ShiftBreak::query()
                ->where('employee_id', $employee->id)
                ->whereNull('ended_at')
                ->orderByDesc('started_at')
                ->first();

            if ($break === null) {
                throw ValidationException::withMessages([
                    'break' => [__('Faol tanaffus topilmadi')],
                ]);
            }

            $now = now();
            $minutes = max(0, (int) $break->started_at->diffInMinutes($now));

            $break->update([
                'ended_at' => $now,
                'duration_minutes' => $minutes,
            ]);

            return $break->fresh();
        });
    }
}
