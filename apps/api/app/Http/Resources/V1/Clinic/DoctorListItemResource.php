<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Clinic;

use App\Domain\Clinic\Models\ClinicDoctor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Row shape for /api/v1/ceo/doctors — flat list with clinic + department
 * names denormalised in, plus derived stats (feedback, rating, complaints)
 * and a "soglom / diqqat / kritik" health-status indicator.
 *
 * @mixin ClinicDoctor
 */
class DoctorListItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $count = (int) ($this->feedback_count ?? 0);
        $avg = $this->avg_rating !== null
            ? round((float) $this->avg_rating, 1)
            : null;
        $open = (int) ($this->open_complaints ?? 0);

        $status = 'soglom';
        $reason = null;
        if ($open >= 3 || ($avg !== null && $avg < 3.0 && $count >= 5)) {
            $status = 'kritik';
            $reason = $open >= 3
                ? "{$open} ta ochiq shikoyat"
                : __('Reyting past');
        } elseif (($avg !== null && $avg < 4.0 && $count > 0) || $open >= 1) {
            $status = 'diqqat';
            $reason = $open >= 1
                ? "{$open} ta ochiq shikoyat"
                : __('Reyting 4.0 dan past');
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialty' => $this->specialty,
            'photo_url' => $this->photo_url,
            'is_active' => (bool) $this->is_active,
            'clinic' => $this->clinic !== null ? [
                'id' => $this->clinic->id,
                'name' => $this->clinic->name,
                'slug' => $this->clinic->slug,
                'region' => $this->clinic->region,
            ] : null,
            'department' => $this->department !== null ? [
                'id' => $this->department->id,
                'name' => $this->department->name,
            ] : null,
            'feedback_count' => $count,
            'avg_rating' => $avg,
            'open_complaints' => $open,
            'status' => $status,
            'reason' => $reason,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
