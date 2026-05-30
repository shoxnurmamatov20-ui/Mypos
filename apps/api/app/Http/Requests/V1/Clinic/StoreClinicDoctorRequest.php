<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Clinic;

use Illuminate\Foundation\Http\FormRequest;

class StoreClinicDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
            'department_id' => ['nullable', 'integer', 'exists:clinic_departments,id'],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'photo_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
