<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Employee;

use App\Domain\Employee\Enums\ShiftStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScheduleShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'scheduled_start' => ['required', 'date'],
            'scheduled_end' => ['required', 'date', 'after:scheduled_start'],
            'status' => ['nullable', 'string', Rule::in(ShiftStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
