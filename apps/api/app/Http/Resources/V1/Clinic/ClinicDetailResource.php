<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Clinic;

use App\Domain\Clinic\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Clinic
 */
class ClinicDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $feedback = $this->feedback ?? collect();
        $complaints = $this->complaints ?? collect();

        $verifiedCount = (int) $feedback->where('is_verified', true)->count();
        $avgRating = $feedback->where('rating', '!=', null)->avg('rating');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'address' => $this->address,
            'phone' => $this->phone,
            'region' => $this->region,
            'logo_url' => $this->logo_url,
            'is_active' => (bool) $this->is_active,
            'stats' => [
                'departments_count' => $this->departments->count(),
                'doctors_count' => $this->doctors->count(),
                'feedback_total' => $feedback->count(),
                'avg_rating' => $avgRating !== null ? round((float) $avgRating, 1) : null,
                'verified_count' => $verifiedCount,
                'open_complaints' => $complaints->count(),
                'urgent_complaints' => (int) $complaints->where('is_urgent', true)->count(),
            ],
            'departments' => ClinicDepartmentResource::collection($this->departments),
            'doctors' => ClinicDoctorResource::collection($this->doctors),
            'recent_feedback' => ClinicFeedbackResource::collection($feedback),
        ];
    }
}
