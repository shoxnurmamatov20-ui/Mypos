<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Employee;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'employee_code' => ['sometimes', 'string', 'min:1', 'max:32'],
            'position' => ['sometimes', 'string', Rule::in(Role::values())],
            'hire_date' => ['sometimes', 'date'],
            'base_salary' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'hourly_rate' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', Rule::in(EmployeeStatus::values())],
            'terminated_at' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'emergency_contact' => ['sometimes', 'nullable', 'string', 'max:128'],
            'documents' => ['sometimes', 'nullable', 'array'],

            'user_data' => ['sometimes', 'array'],
            'user_data.name' => ['sometimes', 'string', 'min:1', 'max:128'],
            'user_data.phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'user_data.locale' => ['sometimes', 'string', 'in:uz,ru,en'],
        ];
    }
}
