<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class CreateDoctorAction
{
    /**
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException when department doesn't belong to the clinic.
     */
    public function execute(array $data): ClinicDoctor
    {
        $name = trim((string) preg_replace('/\s+/u', ' ', (string) $data['name']));

        if (! empty($data['department_id'])) {
            $dep = ClinicDepartment::query()->find((int) $data['department_id']);
            if ($dep === null || $dep->clinic_id !== (int) $data['clinic_id']) {
                throw ValidationException::withMessages([
                    'department_id' => __("Bo'lim tanlangan klinikaga tegishli emas"),
                ]);
            }
        }

        return ClinicDoctor::create([
            'clinic_id' => (int) $data['clinic_id'],
            'department_id' => isset($data['department_id']) && $data['department_id'] !== ''
                ? (int) $data['department_id']
                : null,
            'name' => $name,
            'specialty' => isset($data['specialty']) ? trim((string) $data['specialty']) : null,
            'photo_url' => $data['photo_url'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
    }
}
