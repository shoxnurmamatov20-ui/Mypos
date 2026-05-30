<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Table\Models\Table;
use App\Domain\Table\Models\TableCategory;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Visit\Models\VisitToken;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Visit-token CRUD for the CEO panel — port of ShifoReyting's
 * Admin\TokenController, adapted to MyPOS (tenant + table_category + table
 * instead of organization + department + doctor).
 *
 * All endpoints sit behind `auth:sanctum + ceo` middleware, and every query
 * is pre-scoped to `ownedTenantIds()` to guarantee a CEO never sees tokens
 * for restaurants they don't own.
 *
 * @group CEO — Visit tokens
 * @authenticated
 */
class VisitTokenController extends Controller
{
    /** @var list<int> */
    private const PER_PAGE_OPTIONS = [25, 50, 100, 200];

    /** @var list<string> */
    private const ALLOWED_SORTS = ['created_at', 'expires_at', 'used_at', 'visit_reference'];

    /**
     * GET /api/v1/ceo/tokens
     *
     * Paginated list with filters (q, tenant, table_category, table, status)
     * and a summary chip count (total / valid / used / expired) computed in
     * the same scope.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $ownedTenantIds = $user->ownedTenantIds();
        if ($ownedTenantIds === []) {
            return response()->json($this->emptyPayload());
        }

        $per = in_array((int) $request->query('per', 25), self::PER_PAGE_OPTIONS, true)
            ? (int) $request->query('per', 25)
            : 25;
        $page = max(1, (int) $request->query('page', 1));
        $q = trim((string) $request->query('q', ''));
        $tenantId = trim((string) $request->query('tenant', ''));
        $categoryId = trim((string) $request->query('table_category', ''));
        $tableId = trim((string) $request->query('table', ''));
        $status = (string) $request->query('status', '');
        $sort = in_array($request->query('sort'), self::ALLOWED_SORTS, true)
            ? (string) $request->query('sort')
            : 'created_at';
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';

        $query = $this->scopedQuery($ownedTenantIds)
            ->with([
                'tenant:id,name,slug',
                'category:id,tenant_id,name,slug',
                'tableRef:id,tenant_id,name,category_id',
                'creator:id,name,email',
            ]);

        if ($q !== '') {
            $like = '%' . mb_strtolower($q) . '%';
            $query->where(function ($x) use ($like): void {
                $x->whereRaw('LOWER(visit_reference) LIKE ?', [$like])
                    ->orWhereHas('tableRef', fn ($tq) => $tq->whereRaw('LOWER(name) LIKE ?', [$like]))
                    ->orWhereHas('tenant', fn ($oq) => $oq->whereRaw('LOWER(name) LIKE ?', [$like]));
            });
        }
        if ($tenantId !== '' && in_array($tenantId, $ownedTenantIds, true)) {
            $query->where('tenant_id', $tenantId);
        }
        if ($categoryId !== '') {
            $query->where('table_category_id', $categoryId);
        }
        if ($tableId !== '') {
            $query->where('table_id', $tableId);
        }

        $now = now();
        if ($status === 'valid') {
            $query->whereNull('used_at')->where('expires_at', '>', $now);
        } elseif ($status === 'used') {
            $query->whereNotNull('used_at');
        } elseif ($status === 'expired') {
            $query->whereNull('used_at')->where('expires_at', '<=', $now);
        }

        $query->orderBy($sort, $dir)->orderBy('id', 'desc');

        $total = (clone $query)->count();
        $pages = max(1, (int) ceil($total / $per));
        $page = min($page, $pages);
        $items = $query->forPage($page, $per)->get();

        $rows = $items->map(function (VisitToken $t) use ($now): array {
            $statusVal = $t->used_at
                ? 'used'
                : ($t->expires_at && $t->expires_at->greaterThan($now) ? 'valid' : 'expired');

            return [
                'id' => $t->id,
                'tenant_id' => $t->tenant_id,
                'tenant' => $t->tenant?->name,
                'tenant_slug' => $t->tenant?->slug,
                'table_category_id' => $t->table_category_id,
                'table_category' => $t->category ? $this->resolveLocalizedName($t->category->name) : null,
                'table_id' => $t->table_id,
                'table' => $t->tableRef?->name,
                'visit_reference' => $t->visit_reference,
                'status' => $statusVal,
                'created_at' => $t->created_at?->toIso8601String(),
                'created_at_human' => $t->created_at?->format('Y-m-d H:i'),
                'expires_at' => $t->expires_at?->toIso8601String(),
                'expires_at_human' => $t->expires_at?->format('Y-m-d H:i'),
                'used_at' => $t->used_at?->toIso8601String(),
                'used_at_human' => $t->used_at?->format('Y-m-d H:i'),
                'creator' => $t->creator?->name,
                'creator_email' => $t->creator?->email,
            ];
        });

        return response()->json([
            'rows' => $rows,
            'total' => $total,
            'page' => $page,
            'per' => $per,
            'pages' => $pages,
            'sort' => $sort,
            'dir' => $dir,
            'summary' => $this->summary($ownedTenantIds, $tenantId, $categoryId, $tableId),
        ]);
    }

    /**
     * GET /api/v1/ceo/tokens/options
     *
     * Returns the dropdown payload for the filter row: every tenant the CEO
     * owns (with its zones + tables collapsed under it) so the frontend can
     * cascade selects without a second round-trip.
     */
    public function options(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $ownedTenantIds = $user->ownedTenantIds();
        if ($ownedTenantIds === []) {
            return response()->json(['data' => ['tenants' => []]]);
        }

        $tenants = Tenant::query()
            ->whereIn('id', $ownedTenantIds)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        $categories = TableCategory::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $ownedTenantIds)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'tenant_id', 'name', 'slug']);

        $tables = Table::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $ownedTenantIds)
            ->orderBy('name')
            ->get(['id', 'tenant_id', 'category_id', 'name']);

        $payload = $tenants->map(function (Tenant $t) use ($categories, $tables): array {
            return [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'categories' => $categories
                    ->where('tenant_id', $t->id)
                    ->values()
                    ->map(fn (TableCategory $c) => [
                        'id' => $c->id,
                        'name' => $this->resolveLocalizedName($c->name),
                    ])
                    ->all(),
                'tables' => $tables
                    ->where('tenant_id', $t->id)
                    ->values()
                    ->map(fn (Table $tb) => [
                        'id' => $tb->id,
                        'name' => $tb->name,
                        'category_id' => $tb->category_id,
                    ])
                    ->all(),
            ];
        });

        return response()->json(['data' => ['tenants' => $payload]]);
    }

    /**
     * POST /api/v1/ceo/tokens
     *
     * Bulk-mint up to 50 tokens in one transaction. Returns the raw tokens
     * exactly once — the server only persists the sha256 HMAC.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $ownedTenantIds = $user->ownedTenantIds();
        if ($ownedTenantIds === []) {
            return response()->json(['ok' => false, 'message' => __('Sizga biriktirilgan restoran topilmadi')], 403);
        }

        $data = $request->validate([
            'tenant_id' => ['required', 'uuid', Rule::in($ownedTenantIds)],
            'table_category_id' => ['nullable', 'uuid'],
            'table_id' => ['nullable', 'uuid'],
            'visit_reference' => ['nullable', 'string', 'max:255'],
            'ttl_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
            'count' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        if (! empty($data['table_category_id'])) {
            $cat = TableCategory::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('id', $data['table_category_id'])
                ->where('tenant_id', $data['tenant_id'])
                ->first();
            if ($cat === null) {
                return response()->json(['ok' => false, 'errors' => [
                    'table_category_id' => [__("Zona restoranga mos emas")],
                ]], 422);
            }
        }
        if (! empty($data['table_id'])) {
            $tbl = Table::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('id', $data['table_id'])
                ->where('tenant_id', $data['tenant_id'])
                ->first();
            if ($tbl === null) {
                return response()->json(['ok' => false, 'errors' => [
                    'table_id' => [__("Stol restoranga mos emas")],
                ]], 422);
            }
        }

        $ttl = (int) ($data['ttl_hours'] ?? 24);
        $count = (int) ($data['count'] ?? 1);
        $expiresAt = now()->addHours($ttl);

        $created = [];
        DB::transaction(function () use ($data, $user, $count, $expiresAt, &$created): void {
            for ($i = 0; $i < $count; $i++) {
                $raw = Str::random(48);
                $hash = VisitToken::hashRawToken($raw);
                $token = VisitToken::query()->create([
                    'tenant_id' => $data['tenant_id'],
                    'table_category_id' => $data['table_category_id'] ?? null,
                    'table_id' => $data['table_id'] ?? null,
                    'created_by' => $user->id,
                    'token_hash' => $hash,
                    'visit_reference' => $data['visit_reference'] ?? null,
                    'expires_at' => $expiresAt,
                ]);
                $created[] = [
                    'id' => $token->id,
                    'token' => $raw,
                    'url' => url('/f/' . $raw),
                    'expires_at' => $expiresAt->toIso8601String(),
                ];
            }
        });

        return response()->json(['ok' => true, 'tokens' => $created, 'count' => count($created)]);
    }

    /**
     * POST /api/v1/ceo/tokens/bulk
     *
     * Bulk revoke (force-expire) or delete. Only tokens belonging to
     * tenants the CEO owns are touched — others are silently skipped.
     */
    public function bulk(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $ownedTenantIds = $user->ownedTenantIds();

        $data = $request->validate([
            'action' => ['required', 'string', 'in:revoke,delete'],
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['uuid'],
        ]);

        $count = 0;
        DB::transaction(function () use ($data, $ownedTenantIds, &$count): void {
            $rows = $this->scopedQuery($ownedTenantIds)
                ->whereIn('id', $data['ids'])
                ->get();
            foreach ($rows as $t) {
                if ($data['action'] === 'revoke') {
                    $t->update(['expires_at' => now()]);
                } else {
                    $t->delete();
                }
                $count++;
            }
        });

        return response()->json(['ok' => true, 'applied' => $count]);
    }

    /**
     * POST /api/v1/ceo/tokens/{id}/revoke
     *
     * Force-expire a single token. We DO NOT set `used_at` so the
     * "revoked" vs "used" distinction is preserved in audit history.
     */
    public function revoke(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $ownedTenantIds = $user->ownedTenantIds();

        $token = $this->scopedQuery($ownedTenantIds)->where('id', $id)->first();
        if ($token === null) {
            return response()->json(['ok' => false, 'message' => __('Token topilmadi')], 404);
        }

        $token->update(['expires_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /api/v1/ceo/tokens/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $ownedTenantIds = $user->ownedTenantIds();

        $token = $this->scopedQuery($ownedTenantIds)->where('id', $id)->first();
        if ($token === null) {
            return response()->json(['ok' => false, 'message' => __('Token topilmadi')], 404);
        }

        $token->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Cross-tenant base query — uses `withoutGlobalScopes(['tenant'])`
     * (the CEO is allowed to cross the BelongsToTenant scope), but always
     * pre-filtered by `ownedTenantIds()` so a CEO can never see tokens
     * outside their ownership set.
     *
     * @param  list<string>  $ownedTenantIds
     */
    private function scopedQuery(array $ownedTenantIds): \Illuminate\Database\Eloquent\Builder
    {
        return VisitToken::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $ownedTenantIds);
    }

    /**
     * @param  list<string>  $ownedTenantIds
     * @return array<string, int>
     */
    private function summary(array $ownedTenantIds, string $tenantId, string $categoryId, string $tableId): array
    {
        $base = $this->scopedQuery($ownedTenantIds)
            ->when($tenantId !== '' && in_array($tenantId, $ownedTenantIds, true), fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($categoryId !== '', fn ($q) => $q->where('table_category_id', $categoryId))
            ->when($tableId !== '', fn ($q) => $q->where('table_id', $tableId));

        $now = now();

        return [
            'total' => (clone $base)->count(),
            'valid' => (clone $base)->whereNull('used_at')->where('expires_at', '>', $now)->count(),
            'used' => (clone $base)->whereNotNull('used_at')->count(),
            'expired' => (clone $base)->whereNull('used_at')->where('expires_at', '<=', $now)->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'rows' => [],
            'total' => 0,
            'page' => 1,
            'per' => 25,
            'pages' => 1,
            'sort' => 'created_at',
            'dir' => 'desc',
            'summary' => ['total' => 0, 'valid' => 0, 'used' => 0, 'expired' => 0],
        ];
    }

    /**
     * TableCategory.name is a JSON array keyed by locale (`{uz, ru, en}`).
     * Pick the request locale, falling back to `uz` and then the first
     * non-empty string. Returns `null` if every value is empty.
     */
    private function resolveLocalizedName(mixed $raw): ?string
    {
        if (is_string($raw)) {
            return $raw === '' ? null : $raw;
        }
        if (! is_array($raw)) {
            return null;
        }
        $locale = (string) app()->getLocale();
        foreach ([$locale, 'uz', 'ru', 'en'] as $key) {
            if (isset($raw[$key]) && is_string($raw[$key]) && $raw[$key] !== '') {
                return $raw[$key];
            }
        }
        foreach ($raw as $v) {
            if (is_string($v) && $v !== '') {
                return $v;
            }
        }
        return null;
    }
}
