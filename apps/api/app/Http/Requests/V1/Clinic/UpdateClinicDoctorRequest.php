<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Clinic;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicDoctorRequest extends FormRequest
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
            'clinic_id' => ['sometimes', 'integer', 'exists:clinics,id'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:clinic_departments,id'],
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:255'],
            'specialty' => ['sometimes', 'nullable', 'string', 'max:255'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
