<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\ClinicComplaint;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

/**
 * Cross-clinic complaints listing for the CEO panel — port of the
 * ShifoReyting admin complaints index. Returns a paginated set plus a
 * summary block of counters used by the dashboard stat cards.
 *
 * Filters are intentionally permissive — any unknown / blank value is
 * ignored so the URL stays clean.
 *
 * @phpstan-type FilterSet array{
 *     q?: string|null,
 *     clinic_id?: int|null,
 *     region?: string|null,
 *     severity?: string|null,
 *     status?: string|null,
 *     urgent?: bool|null,
 *     stale?: bool|null,
 *     from?: CarbonInterface|null,
 *     to?: CarbonInterface|null,
 *     sort?: string|null,
 *     dir?: string|null,
 *     per?: int|null
 * }
 */
class ListComplaintsAction
{
    private const ALLOWED_SORTS = ['created_at', 'severity', 'status', 'resolved_at'];

    /**
     * @param FilterSet $filters
     * @return array{
     *     paginator: LengthAwarePaginator,
     *     summary: array<string, int|float>
     * }
     */
    public function execute(array $filters): array
    {
        $query = ClinicComplaint::query()
            ->with([
                'clinic:id,name,region',
                'department:id,name',
                'doctor:id,name,specialty',
            ]);

        $this->applyFilters($query, $filters);

        $sort = in_array($filters['sort'] ?? '', self::ALLOWED_SORTS, true)
            ? $filters['sort']
            : 'created_at';
        $dir = ($filters['dir'] ?? '') === 'asc' ? 'asc' : 'desc';

        $per = (int) ($filters['per'] ?? 25);
        $per = max(10, min(200, $per));

        $paginator = $query
            ->orderBy($sort, $dir)
            ->orderByDesc('id')
            ->paginate($per);

        return [
            'paginator' => $paginator,
            'summary' => $this->summary(),
        ];
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<ClinicComplaint> $query
     * @param FilterSet $filters
     */
    private function applyFilters($query, array $filters): void
    {
        $q = isset($filters['q']) ? trim((string) $filters['q']) : '';
        if ($q !== '') {
            $query->where(function ($q2) use ($q): void {
                $like = '%' . $q . '%';
                $q2->where('summary', 'like', $like)
                    ->orWhereHas('clinic', fn ($c) => $c->where('name', 'like', $like))
                    ->orWhereHas('doctor', fn ($d) => $d->where('name', 'like', $like));
            });
        }

        if (! empty($filters['clinic_id'])) {
            $query->where('clinic_id', (int) $filters['clinic_id']);
        }

        if (! empty($filters['region'])) {
            $region = (string) $filters['region'];
            $query->whereHas('clinic', fn ($c) => $c->where('region', $region));
        }

        if (! empty($filters['severity']) && in_array($filters['severity'], ClinicComplaint::SEVERITIES, true)) {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['status']) && in_array($filters['status'], ClinicComplaint::STATUSES, true)) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['urgent']) && $filters['urgent'] !== null) {
            $query->where('is_urgent', (bool) $filters['urgent']);
        }

        if (! empty($filters['stale'])) {
            $cutoff = now()->subHours(ClinicComplaint::STALE_HOURS);
            $query->whereIn('status', ['open', 'in_review'])
                ->where('created_at', '<', $cutoff);
        }

        if (! empty($filters['from'])) {
            $query->where('created_at', '>=', Carbon::parse((string) $filters['from'])->startOfDay());
        }

        if (! empty($filters['to'])) {
            $query->where('created_at', '<=', Carbon::parse((string) $filters['to'])->endOfDay());
        }
    }

    /**
     * Counters surfaced on the dashboard cards above the list.
     *
     * Computed across ALL complaints (no filters) so the cards represent
     * the global state of the system, not the current view.
     *
     * @return array<string, int|float>
     */
    private function summary(): array
    {
        $rows = ClinicComplaint::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $urgent = (int) ClinicComplaint::query()
            ->where('is_urgent', true)
            ->whereNotIn('status', ['resolved'])
            ->count();

        $staleCutoff = now()->subHours(ClinicComplaint::STALE_HOURS);
        $stale = (int) ClinicComplaint::query()
            ->whereIn('status', ['open', 'in_review'])
            ->where('created_at', '<', $staleCutoff)
            ->count();

        $resolvedQuery = ClinicComplaint::query()
            ->where('status', 'resolved')
            ->whereNotNull('resolved_at');

        $avgHours = (float) $resolvedQuery
            ->get()
            ->avg(fn (ClinicComplaint $c): float => max(
                0.0,
                ($c->resolved_at?->diffInHours($c->created_at) ?? 0)
            ));

        return [
            'total' => (int) ClinicComplaint::query()->count(),
            'open' => (int) ($rows['open'] ?? 0),
            'in_review' => (int) ($rows['in_review'] ?? 0),
            'resolved' => (int) ($rows['resolved'] ?? 0),
            'escalated' => (int) ($rows['escalated'] ?? 0),
            'urgent' => $urgent,
            'stale' => $stale,
            'avg_resolution_hours' => round($avgHours, 1),
        ];
    }
}
