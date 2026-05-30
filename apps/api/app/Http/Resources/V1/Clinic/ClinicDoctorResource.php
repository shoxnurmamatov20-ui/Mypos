<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Clinic;

use App\Domain\Clinic\Models\ClinicDoctor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ClinicDoctor
 */
class ClinicDoctorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dept = $this->department;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialty' => $this->specialty,
            'photo_url' => $this->photo_url,
            'is_active' => (bool) $this->is_active,
            'department' => $dept !== null ? [
                'id' => $dept->id,
                'name' => $dept->name,
            ] : null,
        ];
    }
}
