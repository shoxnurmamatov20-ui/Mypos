<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\ClinicComplaint;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Domain\Clinic\Models\ClinicFeedback;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Cross-clinic flat-list doctor query for the CEO panel /dashboard/doctors
 * page. Mirrors ShifoReyting's admin DoctorController->list endpoint.
 *
 * Supports: search (name/specialty), filter (clinic, department, specialty,
 * is_active), sort (name/specialty/created_at), pagination.
 *
 * Derives per-doctor stats (feedback_count, avg_rating, open_complaints) via
 * subqueries to stay N+1-safe regardless of page size.
 */
class ListDoctorsAction
{
    private const ALLOWED_SORTS = ['name', 'specialty', 'created_at'];

    /**
     * @param  array{q?:string,clinic_id?:int|string,department_id?:int|string,specialty?:string,is_active?:string|bool|null,sort?:string,dir?:string,per_page?:int|string}  $filters
     * @return LengthAwarePaginator<int, ClinicDoctor>
     */
    public function execute(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 25);
        if ($perPage < 1 || $perPage > 200) {
            $perPage = 25;
        }
        $sort = in_array($filters['sort'] ?? null, self::ALLOWED_SORTS, true)
            ? (string) $filters['sort']
            : 'name';
        $dir = ($filters['dir'] ?? null) === 'desc' ? 'desc' : 'asc';

        $query = ClinicDoctor::query()
            ->with(['clinic:id,name,slug,region', 'department:id,name'])
            ->addSelect([
                'feedback_count' => ClinicFeedback::query()
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('doctor_id', 'clinic_doctors.id'),
                'avg_rating' => ClinicFeedback::query()
                    ->selectRaw('AVG(rating)')
                    ->whereColumn('doctor_id', 'clinic_doctors.id')
                    ->whereNotNull('rating'),
                'open_complaints' => ClinicComplaint::query()
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('doctor_id', 'clinic_doctors.id')
                    ->where('status', 'open'),
            ]);

        $this->applyFilters($query, $filters);

        $query->orderBy($sort, $dir)->orderBy('id', 'asc');

        return $query->paginate($perPage);
    }

    /**
     * @param  Builder<ClinicDoctor>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $q = trim((string) ($filters['q'] ?? ''));
        if ($q !== '') {
            $like = '%'.mb_strtolower($q).'%';
            $query->where(function (Builder $x) use ($like): void {
                // Single quotes — "" is an (empty, invalid) IDENTIFIER on
                // PostgreSQL, not an empty string literal like on MySQL.
                $x->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw("LOWER(COALESCE(specialty, '')) LIKE ?", [$like])
                    ->orWhereHas('clinic', function (Builder $cq) use ($like): void {
                        $cq->whereRaw('LOWER(name) LIKE ?', [$like]);
                    });
            });
        }

        if (! empty($filters['clinic_id'])) {
            $query->where('clinic_id', (int) $filters['clinic_id']);
        }
        if (! empty($filters['department_id'])) {
            $query->where('department_id', (int) $filters['department_id']);
        }
        if (! empty($filters['specialty'])) {
            $query->where('specialty', (string) $filters['specialty']);
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $active = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($active !== null) {
                $query->where('is_active', $active);
            }
        }
    }
}
