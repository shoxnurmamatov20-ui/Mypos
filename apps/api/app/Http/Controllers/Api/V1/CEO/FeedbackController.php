<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Customer\Models\OrderReview;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * CEO feedback moderation — replicates the ShifoReyting `FeedbackAdminController`
 * pattern, adapted for the MyPOS `order_reviews` model (1-5 star order reviews
 * with optional food / delivery sub-ratings and a comment).
 *
 * All endpoints under `/api/v1/ceo/feedback/*` go through `EnsureCEO`; queries
 * cross the `BelongsToTenant` global scope via `withoutGlobalScopes(['tenant'])`
 * but are always pre-scoped by `ownedTenantIds()`, so a CEO only ever sees
 * reviews on orders that belong to their own restaurants.
 */
class FeedbackController extends Controller
{
    private const ALLOWED_SORTS = ['created_at', 'rating'];

    private const PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];

    public function list(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenantIds = $user->ownedTenantIds();

        if (count($tenantIds) === 0) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'page' => 1, 'per' => 25, 'pages' => 1],
            ]);
        }

        $perRaw = (int) $request->query('per', 25);
        $per = in_array($perRaw, self::PER_PAGE_OPTIONS, true) ? $perRaw : 25;
        $page = max(1, (int) $request->query('page', 1));
        $q = trim((string) $request->query('q', ''));
        $tenantId = trim((string) $request->query('tenant_id', ''));
        $rating = (int) $request->query('rating', 0);
        $minRating = (int) $request->query('min_rating', 0);
        $hasComment = (string) $request->query('has_comment', '');
        $from = trim((string) $request->query('from', ''));
        $to = trim((string) $request->query('to', ''));
        $sort = in_array($request->query('sort'), self::ALLOWED_SORTS, true)
            ? (string) $request->query('sort')
            : 'created_at';
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';

        $query = OrderReview::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $tenantIds)
            ->with([
                // Eager-loads must bypass the tenant scope too — otherwise the
                // CEO's cross-tenant view loses relation data on any restaurant
                // outside the request's tenant context.
                'order' => fn ($q) => $q->withoutGlobalScopes(['tenant'])
                    ->select('id', 'tenant_id', 'order_no', 'total_amount', 'currency', 'type', 'status', 'created_at'),
                'customer' => fn ($q) => $q->withoutGlobalScopes(['tenant'])
                    ->select('id', 'tenant_id', 'name', 'phone'),
            ]);

        if ($tenantId !== '' && in_array($tenantId, $tenantIds, true)) {
            $query->where('tenant_id', $tenantId);
        }

        if ($q !== '') {
            $like = '%'.mb_strtolower($q).'%';
            $query->where(function ($x) use ($like): void {
                $x->whereRaw('LOWER(comment) LIKE ?', [$like])
                    ->orWhereHas('order', fn ($oq) => $oq->whereRaw('LOWER(order_no) LIKE ?', [$like]))
                    ->orWhereHas('customer', fn ($cq) => $cq
                        ->whereRaw('LOWER(name) LIKE ?', [$like])
                        ->orWhere('phone', 'like', $like));
            });
        }

        if ($rating >= 1 && $rating <= 5) {
            $query->where('rating', $rating);
        }
        if ($minRating >= 1 && $minRating <= 5) {
            $query->where('rating', '>=', $minRating);
        }
        if ($hasComment === '1') {
            $query->whereNotNull('comment')->where('comment', '!=', '');
        } elseif ($hasComment === '0') {
            $query->where(function ($x): void {
                $x->whereNull('comment')->orWhere('comment', '=', '');
            });
        }
        if ($from !== '') {
            $query->where('created_at', '>=', $from);
        }
        if ($to !== '') {
            $query->where('created_at', '<=', $to.' 23:59:59');
        }

        $query->orderBy($sort, $dir)->orderBy('id', 'desc');

        $total = (clone $query)->count();
        $pages = max(1, (int) ceil($total / $per));
        $page = min($page, $pages);
        $items = $query->forPage($page, $per)->get();

        $tenantNames = Tenant::query()
            ->withoutGlobalScopes()
            ->whereIn('id', $tenantIds)
            ->pluck('name', 'id');

        $rows = $items->map(function (OrderReview $r) use ($tenantNames): array {
            return [
                'id' => $r->id,
                'tenant_id' => $r->tenant_id,
                'restaurant' => $tenantNames->get($r->tenant_id),
                'order_id' => $r->order_id,
                'order_no' => $r->order?->order_no,
                'order_type' => $r->order?->type,
                'order_total' => $r->order?->total_amount,
                'order_currency' => $r->order?->currency,
                'customer_id' => $r->customer_id,
                'customer_name' => $r->customer?->name,
                'customer_phone' => $r->customer?->phone,
                'rating' => (int) $r->rating,
                'food_rating' => $r->food_rating !== null ? (int) $r->food_rating : null,
                'delivery_rating' => $r->delivery_rating !== null ? (int) $r->delivery_rating : null,
                'comment' => $r->comment,
                'has_comment' => ! empty($r->comment),
                'created_at' => optional($r->created_at)->toIso8601String(),
                'created_at_label' => optional($r->created_at)->format('Y-m-d H:i'),
            ];
        });

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per' => $per,
                'pages' => $pages,
                'sort' => $sort,
                'dir' => $dir,
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenantIds = $user->ownedTenantIds();

        if (count($tenantIds) === 0) {
            return response()->json(['data' => $this->emptyStats()]);
        }

        $tenantId = trim((string) $request->query('tenant_id', ''));
        $from = trim((string) $request->query('from', ''));
        $to = trim((string) $request->query('to', ''));

        $base = OrderReview::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $tenantIds);

        if ($tenantId !== '' && in_array($tenantId, $tenantIds, true)) {
            $base->where('tenant_id', $tenantId);
        }
        if ($from !== '') {
            $base->where('created_at', '>=', $from);
        }
        if ($to !== '') {
            $base->where('created_at', '<=', $to.' 23:59:59');
        }

        $total = (clone $base)->count();
        $avgRating = (float) (clone $base)->avg('rating');
        $avgFood = (float) (clone $base)->whereNotNull('food_rating')->avg('food_rating');
        $avgDelivery = (float) (clone $base)->whereNotNull('delivery_rating')->avg('delivery_rating');
        $withComment = (clone $base)->whereNotNull('comment')->where('comment', '!=', '')->count();

        $distribution = (clone $base)
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->all();

        $bucket = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        foreach ($distribution as $star => $count) {
            $idx = (int) $star;
            if ($idx >= 1 && $idx <= 5) {
                $bucket[$idx] = (int) $count;
            }
        }

        return response()->json([
            'data' => [
                'total' => $total,
                'avg_rating' => round($avgRating, 2),
                'avg_food_rating' => round($avgFood, 2),
                'avg_delivery_rating' => round($avgDelivery, 2),
                'with_comment' => $withComment,
                'positive_count' => $bucket[4] + $bucket[5],
                'negative_count' => $bucket[1] + $bucket[2],
                'distribution' => [
                    ['rating' => 5, 'count' => $bucket[5]],
                    ['rating' => 4, 'count' => $bucket[4]],
                    ['rating' => 3, 'count' => $bucket[3]],
                    ['rating' => 2, 'count' => $bucket[2]],
                    ['rating' => 1, 'count' => $bucket[1]],
                ],
            ],
        ]);
    }

    public function show(Request $request, string $review): JsonResponse
    {
        $r = $this->findOwned($request, $review);

        $r->load([
            'order' => fn ($q) => $q->withoutGlobalScopes(['tenant'])
                ->select('id', 'tenant_id', 'order_no', 'total_amount', 'currency', 'type', 'status', 'created_at', 'completed_at'),
            'customer' => fn ($q) => $q->withoutGlobalScopes(['tenant'])
                ->select('id', 'tenant_id', 'name', 'phone'),
        ]);

        $tenant = Tenant::query()->withoutGlobalScopes()->find($r->tenant_id);

        return response()->json([
            'data' => [
                'id' => $r->id,
                'tenant_id' => $r->tenant_id,
                'restaurant' => $tenant?->name,
                'order' => $r->order ? [
                    'id' => $r->order->id,
                    'order_no' => $r->order->order_no,
                    'type' => $r->order->type,
                    'status' => $r->order->status,
                    'total_amount' => $r->order->total_amount,
                    'currency' => $r->order->currency,
                    'created_at' => optional($r->order->created_at)->toIso8601String(),
                    'completed_at' => optional($r->order->completed_at)->toIso8601String(),
                ] : null,
                'customer' => $r->customer ? [
                    'id' => $r->customer->id,
                    'name' => $r->customer->name,
                    'phone' => $r->customer->phone,
                ] : null,
                'rating' => (int) $r->rating,
                'food_rating' => $r->food_rating !== null ? (int) $r->food_rating : null,
                'delivery_rating' => $r->delivery_rating !== null ? (int) $r->delivery_rating : null,
                'comment' => $r->comment,
                'created_at' => optional($r->created_at)->toIso8601String(),
                'updated_at' => optional($r->updated_at)->toIso8601String(),
            ],
        ]);
    }

    public function destroy(Request $request, string $review): JsonResponse
    {
        $r = $this->findOwned($request, $review);
        $r->delete();

        return response()->json(['data' => ['deleted' => true, 'id' => $review]]);
    }

    public function bulk(Request $request): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', 'string', 'in:delete'],
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['string', 'uuid'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenantIds = $user->ownedTenantIds();

        $count = 0;
        DB::transaction(function () use ($data, $tenantIds, &$count): void {
            $rows = OrderReview::query()
                ->withoutGlobalScopes(['tenant'])
                ->whereIn('tenant_id', $tenantIds)
                ->whereIn('id', $data['ids'])
                ->get();

            foreach ($rows as $r) {
                if ($data['action'] === 'delete') {
                    $r->delete();
                    $count++;
                }
            }
        });

        return response()->json(['data' => ['applied' => $count]]);
    }

    public function restaurants(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenants = $user->ownedTenants()->get(['tenants.id', 'name', 'slug']);

        return response()->json([
            'data' => $tenants->map(fn (Tenant $t): array => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
            ])->values(),
        ]);
    }

    private function findOwned(Request $request, string $review): OrderReview
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenantIds = $user->ownedTenantIds();

        $r = OrderReview::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $tenantIds)
            ->whereKey($review)
            ->first();

        if ($r === null) {
            throw ValidationException::withMessages([
                'review' => [__('Sharh topilmadi')],
            ]);
        }

        return $r;
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyStats(): array
    {
        return [
            'total' => 0,
            'avg_rating' => 0,
            'avg_food_rating' => 0,
            'avg_delivery_rating' => 0,
            'with_comment' => 0,
            'positive_count' => 0,
            'negative_count' => 0,
            'distribution' => [
                ['rating' => 5, 'count' => 0],
                ['rating' => 4, 'count' => 0],
                ['rating' => 3, 'count' => 0],
                ['rating' => 2, 'count' => 0],
                ['rating' => 1, 'count' => 0],
            ],
        ];
    }
}
