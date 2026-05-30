<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Clinic;

use App\Domain\Clinic\Models\ClinicComplaint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wire shape for a single complaint row.
 *
 * @mixin ClinicComplaint
 */
class ClinicComplaintResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $clinic = $this->relationLoaded('clinic') ? $this->clinic : null;
        $department = $this->relationLoaded('department') ? $this->department : null;
        $doctor = $this->relationLoaded('doctor') ? $this->doctor : null;

        $ageHours = (int) $this->created_at->diffInHours(now());
        $resolutionHours = $this->resolved_at !== null
            ? (int) $this->created_at->diffInHours($this->resolved_at)
            : null;

        return [
            'id' => $this->id,
            'severity' => $this->severity,
            'status' => $this->status,
            'is_urgent' => $this->is_urgent,
            'summary' => $this->summary,
            'created_at' => $this->created_at->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'age_hours' => $ageHours,
            'resolution_hours' => $resolutionHours,
            'is_stale' => in_array($this->status, ['open', 'in_review'], true)
                && $ageHours >= ClinicComplaint::STALE_HOURS,
            'clinic' => $clinic !== null
                ? ['id' => $clinic->id, 'name' => $clinic->name, 'region' => $clinic->region]
                : null,
            'department' => $department !== null
                ? ['id' => $department->id, 'name' => $department->name]
                : null,
            'doctor' => $doctor !== null
                ? ['id' => $doctor->id, 'name' => $doctor->name, 'specialty' => $doctor->specialty]
                : null,
        ];
    }
}
