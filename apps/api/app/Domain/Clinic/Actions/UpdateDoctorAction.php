<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use Illuminate\Validation\ValidationException;

class UpdateDoctorAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(ClinicDoctor $doctor, array $data): ClinicDoctor
    {
        $updates = [];

        if (array_key_exists('name', $data)) {
            $updates['name'] = trim((string) preg_replace('/\s+/u', ' ', (string) $data['name']));
        }
        if (array_key_exists('specialty', $data)) {
            $updates['specialty'] = $data['specialty'] === null
                ? null
                : trim((string) $data['specialty']);
        }
        if (array_key_exists('photo_url', $data)) {
            $updates['photo_url'] = $data['photo_url'];
        }
        if (array_key_exists('is_active', $data)) {
            $updates['is_active'] = (bool) $data['is_active'];
        }

        $targetClinicId = array_key_exists('clinic_id', $data)
            ? (int) $data['clinic_id']
            : $doctor->clinic_id;

        if (array_key_exists('department_id', $data)) {
            $depId = $data['department_id'];
            if ($depId === null || $depId === '') {
                $updates['department_id'] = null;
            } else {
                $dep = ClinicDepartment::query()->find((int) $depId);
                if ($dep === null || $dep->clinic_id !== $targetClinicId) {
                    throw ValidationException::withMessages([
                        'department_id' => __("Bo'lim tanlangan klinikaga tegishli emas"),
                    ]);
                }
                $updates['department_id'] = (int) $depId;
            }
        }

        if (array_key_exists('clinic_id', $data)) {
            $updates['clinic_id'] = $targetClinicId;
        }

        $doctor->update($updates);

        return $doctor->fresh(['clinic:id,name,slug,region', 'department:id,name']);
    }
}
