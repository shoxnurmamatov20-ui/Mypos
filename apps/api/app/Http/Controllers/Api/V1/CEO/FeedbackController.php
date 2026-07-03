<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Customer\Models\OrderReview;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CEO guest-feedback surface — order reviews across every owned restaurant.
 *
 * Tenant isolation: CEO users carry no tenant_id, so every query opts out of
 * the BelongsToTenant scope and re-applies an explicit
 * `whereIn(tenant_id, ownedTenantIds())` — the standard `/api/v1/ceo/*`
 * pattern.
 */
class FeedbackController extends Controller
{
    /**
     * GET /api/v1/ceo/feedback — filterable, paginated review list.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'tenant_id' => ['nullable', 'uuid'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'has_comment' => ['nullable', 'in:0,1'],
            'sort' => ['nullable', 'in:created_at,rating'],
            'dir' => ['nullable', 'in:asc,desc'],
            'per' => ['nullable', 'integer', 'min:1', 'max:200'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = $this->ownedReviews($request)->with($this->reviewRelations());
        $this->applyFilters($query, $validated);

        $sort = $validated['sort'] ?? 'created_at';
        $dir = ($validated['dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $paginator = $query
            ->orderBy($sort, $dir)
            ->orderBy('id')
            ->paginate((int) ($validated['per'] ?? 25));

        return response()->json([
            'data' => collect($paginator->items())->map(
                fn (OrderReview $review): array => $this->shapeRow($review),
            ),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'pages' => $paginator->lastPage(),
                'per' => $paginator->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/ceo/feedback/stats — KPI cards + rating distribution.
     */
    public function stats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['nullable', 'uuid'],
        ]);

        $base = $this->ownedReviews($request);
        if (($validated['tenant_id'] ?? null) !== null) {
            $base->where('tenant_id', $validated['tenant_id']);
        }

        /** @var object{total: int|string|null, avg_rating: float|string|null, positive_count: int|string|null, negative_count: int|string|null}|null $agg */
        $agg = (clone $base)
            ->toBase()
            ->selectRaw(
                'COUNT(*) AS total,
                 AVG(rating) AS avg_rating,
                 SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive_count,
                 SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS negative_count',
            )
            ->first();

        $byRating = (clone $base)
            ->selectRaw('rating, COUNT(*) AS cnt')
            ->groupBy('rating')
            ->pluck('cnt', 'rating');

        $distribution = [];
        for ($rating = 5; $rating >= 1; $rating--) {
            $distribution[] = ['rating' => $rating, 'count' => (int) ($byRating[$rating] ?? 0)];
        }

        $avgRating = $agg?->avg_rating;

        return response()->json([
            'data' => [
                'total' => (int) ($agg->total ?? 0),
                'avg_rating' => $avgRating !== null ? round((float) $avgRating, 2) : null,
                'positive_count' => (int) ($agg->positive_count ?? 0),
                'negative_count' => (int) ($agg->negative_count ?? 0),
                'distribution' => $distribution,
            ],
        ]);
    }

    /**
     * GET /api/v1/ceo/feedback/restaurants — filter options.
     */
    public function restaurants(Request $request): JsonResponse
    {
        $tenants = $this->ceoUser($request)
            ->ownedTenants()
            ->orderBy('name')
            ->get(['tenants.id', 'tenants.name', 'tenants.slug']);

        return response()->json([
            'data' => $tenants->map(fn ($tenant): array => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
            ]),
        ]);
    }

    /**
     * GET /api/v1/ceo/feedback/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $review = $this->ownedReviews($request)
            ->with($this->reviewRelations())
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'restaurant' => $review->tenant?->name,
                'customer' => $review->customer !== null
                    ? [
                        'name' => trim(($review->customer->first_name ?? '').' '.($review->customer->last_name ?? '')) ?: null,
                        'phone' => $review->customer->phone,
                    ]
                    : null,
                'order' => $review->order !== null ? ['order_no' => $review->order->order_no] : null,
                'food_rating' => $review->food_rating,
                'delivery_rating' => $review->delivery_rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * DELETE /api/v1/ceo/feedback/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $review = $this->ownedReviews($request)->findOrFail($id);
        $review->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return Builder<OrderReview> */
    private function ownedReviews(Request $request): Builder
    {
        return OrderReview::query()
            ->withoutGlobalScope('tenant')
            ->whereIn('tenant_id', $this->ceoUser($request)->ownedTenantIds());
    }

    /**
     * Eager-loads for review rows. Order and Customer carry the
     * BelongsToTenant scope, which fail-closes for CEO users (they have no
     * tenant_id) — the relations silently resolved to null. Ownership is
     * already enforced by ownedReviews()' whereIn(tenant_id, owned), so
     * dropping the scope on the RELATED rows is safe.
     *
     * @return array<string, \Closure>
     */
    private function reviewRelations(): array
    {
        return [
            'tenant' => fn ($q) => $q->select('id', 'name'),
            'order' => fn ($q) => $q->withoutGlobalScope('tenant')->select('id', 'order_no'),
            'customer' => fn ($q) => $q->withoutGlobalScope('tenant'),
        ];
    }

    /** The `auth:sanctum` + `ceo` middleware guarantee a user; make it typed. */
    private function ceoUser(Request $request): User
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }

        return $user;
    }

    /**
     * @param  Builder<OrderReview>  $query
     * @param  array<string, mixed>  $validated
     */
    private function applyFilters(Builder $query, array $validated): void
    {
        if (($validated['tenant_id'] ?? null) !== null) {
            $query->where('tenant_id', $validated['tenant_id']);
        }
        if (($validated['rating'] ?? null) !== null) {
            $query->where('rating', (int) $validated['rating']);
        }
        if (($validated['has_comment'] ?? '') !== '') {
            $validated['has_comment'] === '1'
                ? $query->whereNotNull('comment')->where('comment', '!=', '')
                : $query->where(fn (Builder $x) => $x->whereNull('comment')->orWhere('comment', ''));
        }
        $q = trim((string) ($validated['q'] ?? ''));
        if ($q !== '') {
            $like = '%'.mb_strtolower($q).'%';
            $query->where(function (Builder $x) use ($like): void {
                $x->whereRaw('LOWER(COALESCE(comment, \'\')) LIKE ?', [$like])
                    ->orWhereHas('order', function (Builder $oq) use ($like): void {
                        $oq->withoutGlobalScope('tenant')
                            ->whereRaw('LOWER(order_no) LIKE ?', [$like]);
                    });
            });
        }
    }

    /** @return array<string, mixed> */
    private function shapeRow(OrderReview $review): array
    {
        $customerName = $review->customer !== null
            ? (trim(($review->customer->first_name ?? '').' '.($review->customer->last_name ?? '')) ?: null)
            : null;

        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'restaurant' => $review->tenant?->name,
            'customer_name' => $customerName,
            'customer_phone' => $review->customer?->phone,
            'order_no' => $review->order?->order_no,
            'comment' => $review->comment,
            'created_at_label' => $review->created_at?->format('Y-m-d H:i'),
        ];
    }
}
