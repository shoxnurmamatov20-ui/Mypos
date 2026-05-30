<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Clinic;

use App\Domain\Clinic\Models\ClinicFeedback;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ClinicFeedback
 */
class ClinicFeedbackResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'is_verified' => (bool) $this->is_verified,
            'sentiment' => $this->sentiment,
            'comment' => $this->comment_redacted,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
        ];
    }
}
