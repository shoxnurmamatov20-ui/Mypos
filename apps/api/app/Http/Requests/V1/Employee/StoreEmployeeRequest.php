<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Employee;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'user_data' => ['required', 'array'],
            'user_data.name' => ['required', 'string', 'min:1', 'max:128'],
            'user_data.email' => ['required', 'email', 'max:128', 'unique:users,email'],
            'user_data.phone' => ['nullable', 'string', 'max:32'],
            'user_data.password' => ['required', 'string', 'min:8', 'max:128'],
            'user_data.locale' => ['nullable', 'string', 'in:uz,ru,en'],

            'employee_code' => ['nullable', 'string', 'min:1', 'max:32'],
            'position' => ['required', 'string', Rule::in(Role::values())],
            'hire_date' => ['required', 'date'],
            'base_salary' => ['nullable', 'integer', 'min:0', 'max:1000000000'],
            'hourly_rate' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'status' => ['nullable', 'string', Rule::in(EmployeeStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],
            'emergency_contact' => ['nullable', 'string', 'max:128'],
            'documents' => ['nullable', 'array'],
            'documents.*.type' => ['required_with:documents', 'string', 'max:64'],
            'documents.*.url' => ['required_with:documents', 'url', 'max:512'],
            'documents.*.uploaded_at' => ['required_with:documents', 'date'],
        ];
    }
}
