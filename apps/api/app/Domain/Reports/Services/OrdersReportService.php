<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Order\Models\Order;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Orders report — paginated tenant-scoped order list with the same filter
 * surface the manager-panel "Buyurtmalar" page exposes. Returns a
 * {@see LengthAwarePaginator} (so the controller can hand it straight to a
 * Resource collection) plus a precomputed summary row covering the same
 * filter set.
 */
final class OrdersReportService
{
    use NormalizesDateRange;

    /**
     * @param array<string, mixed> $filters
     * @return array{paginator: LengthAwarePaginator<Order>, summary: array<string, int>}
     */
    public function list(array $filters): array
    {
        $query = $this->baseQuery($filters);

        // Cloned BEFORE pagination so the summary always matches the
        // user-visible filter set, regardless of which page they're on.
        $summary = $this->summary(clone $query, $filters);

        $sort = (string) ($filters['sort'] ?? '-placed_at');
        $this->applySort($query, $sort);

        $perPage = $this->resolvePerPage($filters['per_page'] ?? null);
        $paginator = $query
            ->with(['table.category', 'servedBy.user', 'customer'])
            ->paginate($perPage)
            ->appends($this->appendQuery($filters));

        return [
            'paginator' => $paginator,
            'summary' => $summary,
        ];
    }

    /**
     * @param array<string, mixed> $filters
     * @return Builder<Order>
     */
    private function baseQuery(array $filters): Builder
    {
        [$from, $to] = $this->normalizeRange(
            isset($filters['from']) ? (string) $filters['from'] : null,
            isset($filters['to']) ? (string) $filters['to'] : null,
        );

        $query = Order::query()->whereBetween('orders.created_at', [$from, $to]);

        if (! empty($filters['status'])) {
            $query->where('orders.status', (string) $filters['status']);
        }
        if (! empty($filters['type'])) {
            $query->where('orders.type', (string) $filters['type']);
        }
        if (! empty($filters['table_id'])) {
            $query->where('orders.table_id', (string) $filters['table_id']);
        }
        if (! empty($filters['employee_id'])) {
            $employeeId = (string) $filters['employee_id'];
            $query->where(function (Builder $q) use ($employeeId): void {
                $q->where('orders.served_by_id', $employeeId)
                    ->orWhere('orders.employee_id', $employeeId)
                    ->orWhere('orders.courier_id', $employeeId);
            });
        }
        if (! empty($filters['payment_method'])) {
            $query->where('orders.payment_method', (string) $filters['payment_method']);
        }
        if (! empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            if ($q !== '') {
                // Escape LIKE wildcards so `%` / `_` in the query string don't
                // expand to a full table scan. Use explicit ESCAPE clause for
                // driver portability (MySQL + Postgres).
                $escaped = addcslashes($q, '%_\\');
                $query->where('orders.order_no', 'like', '%' . $escaped . '%');
            }
        }

        return $query;
    }

    /**
     * Driver-agnostic sort. Whitelist enforced — anything not in the table
     * is silently dropped to the default placed_at DESC. Keeps the controller
     * thin without exposing the column list to FormRequest validation.
     */
    private function applySort(Builder $query, string $sort): void
    {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-+');
        $whitelist = [
            'placed_at', 'created_at', 'total_amount', 'order_no', 'status', 'type', 'paid_at',
        ];
        if (! in_array($column, $whitelist, true)) {
            $column = 'placed_at';
            $direction = 'desc';
        }
        // placed_at can be null on legacy draft rows — fall back to created_at
        // for stable ordering (Postgres puts NULLs LAST on DESC by default,
        // so this matches operator expectations of "newest on top").
        $query->orderBy('orders.' . $column, $direction)
            ->orderBy('orders.created_at', 'desc');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, int>
     */
    private function summary(Builder $query, array $filters = []): array
    {
        // If the caller EXPLICITLY filters by status (e.g. status=cancelled),
        // honor that — don't strip cancelled orders from the summary or the
        // displayed "Tushum" reads 0 while the table below shows non-zero rows.
        $hasExplicitStatus = ! empty($filters['status']);

        $base = $hasExplicitStatus
            ? $query
            : $query->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded']);

        $row = $base
            ->selectRaw(
                'COUNT(*) AS cnt, COALESCE(SUM(orders.total_amount), 0) AS revenue'
            )
            ->first();

        $count = (int) ($row->cnt ?? 0);
        $revenue = (int) ($row->revenue ?? 0);

        return [
            'count' => $count,
            'revenue_minor' => $revenue,
            'avg_ticket_minor' => $count > 0 ? (int) round($revenue / $count) : 0,
        ];
    }

    private function resolvePerPage(mixed $raw): int
    {
        $n = (int) ($raw ?? 30);
        if ($n < 1) {
            $n = 30;
        }
        return min($n, 200);
    }

    /** @param array<string, mixed> $filters @return array<string, mixed> */
    private function appendQuery(array $filters): array
    {
        return array_filter([
            'from' => $filters['from'] ?? null,
            'to' => $filters['to'] ?? null,
            'status' => $filters['status'] ?? null,
            'type' => $filters['type'] ?? null,
            'table_id' => $filters['table_id'] ?? null,
            'employee_id' => $filters['employee_id'] ?? null,
            'payment_method' => $filters['payment_method'] ?? null,
            'q' => $filters['q'] ?? null,
            'sort' => $filters['sort'] ?? null,
            'per_page' => $filters['per_page'] ?? null,
        ], fn ($v): bool => $v !== null && $v !== '');
    }
}
