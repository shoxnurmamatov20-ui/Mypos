<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicComplaint;
use App\Domain\Clinic\Models\ClinicFeedback;
use Illuminate\Support\Collection;

/**
 * Returns every clinic with one-shot aggregated stats:
 *   - departments_count, doctors_count
 *   - feedback: total, avg_rating (1 decimal), verified_count
 *   - complaints: open, urgent
 *
 * No N+1 — uses withCount + per-table aggregate queries keyed by clinic_id.
 */
class ListClinicsAction
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function execute(): Collection
    {
        $clinics = Clinic::query()
            ->withCount(['departments', 'doctors'])
            ->orderBy('name')
            ->get();

        if ($clinics->isEmpty()) {
            return collect();
        }

        $ids = $clinics->pluck('id')->all();

        $feedbackStats = ClinicFeedback::query()
            ->select('clinic_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('AVG(rating) as avg_rating')
            // Bare boolean predicate — portable: PG boolean and MySQL tinyint(1)
            // both evaluate truthy here, while `= 1` breaks on PG (boolean = int).
            ->selectRaw('SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_count')
            ->whereIn('clinic_id', $ids)
            ->groupBy('clinic_id')
            ->get()
            ->keyBy('clinic_id');

        $complaintStats = ClinicComplaint::query()
            ->select('clinic_id')
            ->selectRaw("SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count")
            ->selectRaw('SUM(CASE WHEN is_urgent THEN 1 ELSE 0 END) as urgent_count')
            ->whereIn('clinic_id', $ids)
            ->groupBy('clinic_id')
            ->get()
            ->keyBy('clinic_id');

        return $clinics->map(function (Clinic $clinic) use ($feedbackStats, $complaintStats): array {
            $fb = $feedbackStats->get($clinic->id);
            $cp = $complaintStats->get($clinic->id);

            return [
                'id' => $clinic->id,
                'name' => $clinic->name,
                'slug' => $clinic->slug,
                'address' => $clinic->address,
                'phone' => $clinic->phone,
                'region' => $clinic->region,
                'logo_url' => $clinic->logo_url,
                'is_active' => (bool) $clinic->is_active,
                'departments_count' => (int) ($clinic->departments_count ?? 0),
                'doctors_count' => (int) ($clinic->doctors_count ?? 0),
                'feedback' => [
                    'total' => (int) ($fb->total ?? 0),
                    'avg_rating' => $fb && $fb->avg_rating !== null
                        ? round((float) $fb->avg_rating, 1)
                        : null,
                    'verified_count' => (int) ($fb->verified_count ?? 0),
                ],
                'complaints' => [
                    'open' => (int) ($cp->open_count ?? 0),
                    'urgent' => (int) ($cp->urgent_count ?? 0),
                ],
            ];
        });
    }
}
