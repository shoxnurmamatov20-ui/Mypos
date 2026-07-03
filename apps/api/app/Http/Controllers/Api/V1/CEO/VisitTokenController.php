<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Table\Models\Table;
use App\Domain\Table\Models\TableCategory;
use App\Domain\Visit\Actions\CreateVisitTokenBatchAction;
use App\Domain\Visit\Models\VisitToken;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\CEO\StoreVisitTokenBatchRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CEO visit-token surface: mint, list, revoke and delete guest feedback
 * tokens across every tenant the CEO owns.
 *
 * Tenant isolation: the caller has NO tenant_id (CEO users are cross-tenant),
 * so the BelongsToTenant scope would fail closed. Every query below therefore
 * opts out of the scope and re-applies an explicit
 * `whereIn(tenant_id, ownedTenantIds())` filter — the same pattern the other
 * `/api/v1/ceo/*` controllers use.
 */
class VisitTokenController extends Controller
{
    /**
     * List tokens with filters, pagination and summary chips.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:valid,used,expired'],
            'q' => ['nullable', 'string', 'max:255'],
            'tenant' => ['nullable', 'uuid'],
            'table_category' => ['nullable', 'uuid'],
            'table' => ['nullable', 'uuid'],
            'per' => ['nullable', 'integer', 'min:1', 'max:200'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = $this->ownedTokens($request)
            ->with(['tenant:id,name', 'category:id,name', 'tableRef:id,name', 'creator:id,name'])
            ->orderByDesc('created_at');

        if (($validated['status'] ?? null) !== null) {
            $this->applyStatusFilter($query, $validated['status']);
        }
        if (($validated['tenant'] ?? null) !== null) {
            $query->where('tenant_id', $validated['tenant']);
        }
        if (($validated['table_category'] ?? null) !== null) {
            $query->where('table_category_id', $validated['table_category']);
        }
        if (($validated['table'] ?? null) !== null) {
            $query->where('table_id', $validated['table']);
        }
        if (($validated['q'] ?? '') !== '') {
            $like = '%'.mb_strtolower((string) $validated['q']).'%';
            $query->whereRaw("LOWER(COALESCE(visit_reference, '')) LIKE ?", [$like]);
        }

        $paginator = $query->paginate((int) ($validated['per'] ?? 25));

        return response()->json([
            'rows' => collect($paginator->items())->map(
                fn (VisitToken $t): array => $this->shapeRow($t),
            ),
            'summary' => $this->summary($request),
            'page' => $paginator->currentPage(),
            'pages' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ]);
    }

    /**
     * Filter options: owned tenants, each with table categories and tables.
     */
    public function options(Request $request): JsonResponse
    {
        $tenants = $request->user()->ownedTenants()->orderBy('name')->get(['tenants.id', 'tenants.name']);
        $tenantIds = $tenants->pluck('id');

        $categories = TableCategory::query()
            ->withoutGlobalScope('tenant')
            ->whereIn('tenant_id', $tenantIds)
            ->orderBy('sort_order')
            ->get(['id', 'tenant_id', 'name'])
            ->groupBy('tenant_id');

        $tables = Table::query()
            ->withoutGlobalScope('tenant')
            ->whereIn('tenant_id', $tenantIds)
            ->orderBy('name')
            ->get(['id', 'tenant_id', 'category_id', 'name'])
            ->groupBy('tenant_id');

        return response()->json([
            'data' => [
                'tenants' => $tenants->map(fn ($tenant): array => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'categories' => ($categories->get($tenant->id) ?? collect())
                        ->map(fn ($cat): array => [
                            'id' => $cat->id,
                            'name' => $this->localized($cat->name),
                        ])
                        ->values(),
                    'tables' => ($tables->get($tenant->id) ?? collect())
                        ->map(fn ($table): array => [
                            'id' => $table->id,
                            'name' => (string) $table->name,
                            'category_id' => $table->category_id,
                        ])
                        ->values(),
                ]),
            ],
        ]);
    }

    /**
     * Mint a batch of tokens. Raw tokens are returned exactly once.
     */
    public function store(
        StoreVisitTokenBatchRequest $request,
        CreateVisitTokenBatchAction $action,
    ): JsonResponse {
        $input = $request->validated();
        $input['created_by'] = $request->user()->id;

        $tokens = $action->execute($input);

        return response()->json([
            'ok' => true,
            'count' => count($tokens),
            'tokens' => $tokens,
        ]);
    }

    /**
     * Revoke one token by pulling its expiry to now. 404 for foreign tenants.
     */
    public function revoke(Request $request, string $id): JsonResponse
    {
        $token = $this->ownedTokens($request)->findOrFail($id);
        $token->update(['expires_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * Bulk action over ids — only rows inside owned tenants are touched.
     */
    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:revoke,delete'],
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['uuid'],
        ]);

        $scoped = $this->ownedTokens($request)->whereIn('id', $validated['ids']);

        $applied = $validated['action'] === 'delete'
            ? $scoped->delete()
            : $scoped->update(['expires_at' => now()]);

        return response()->json(['ok' => true, 'applied' => (int) $applied]);
    }

    /**
     * Hard-delete one token. 404 for foreign tenants.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $token = $this->ownedTokens($request)->findOrFail($id);
        $token->delete();

        return response()->json(['ok' => true]);
    }

    /** @return Builder<VisitToken> */
    private function ownedTokens(Request $request): Builder
    {
        return VisitToken::query()
            ->withoutGlobalScope('tenant')
            ->whereIn('tenant_id', $request->user()->ownedTenantIds());
    }

    /** @param Builder<VisitToken> $query */
    private function applyStatusFilter(Builder $query, string $status): void
    {
        match ($status) {
            'used' => $query->whereNotNull('used_at'),
            'expired' => $query->whereNull('used_at')->where('expires_at', '<=', now()),
            default => $query->whereNull('used_at')->where('expires_at', '>', now()),
        };
    }

    /** One aggregate round-trip for the summary chips. */
    private function summary(Request $request): array
    {
        $now = now();
        $agg = $this->ownedTokens($request)
            ->selectRaw(
                'COUNT(*) AS total,
                 SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) AS used,
                 SUM(CASE WHEN used_at IS NULL AND expires_at > ? THEN 1 ELSE 0 END) AS valid,
                 SUM(CASE WHEN used_at IS NULL AND expires_at <= ? THEN 1 ELSE 0 END) AS expired',
                [$now, $now],
            )
            ->first();

        return [
            'total' => (int) ($agg->total ?? 0),
            'valid' => (int) ($agg->valid ?? 0),
            'used' => (int) ($agg->used ?? 0),
            'expired' => (int) ($agg->expired ?? 0),
        ];
    }

    /** @return array<string, mixed> */
    private function shapeRow(VisitToken $token): array
    {
        $status = $token->used_at !== null
            ? 'used'
            : ($token->expires_at->lessThanOrEqualTo(now()) ? 'expired' : 'valid');

        return [
            'id' => $token->id,
            'tenant_id' => $token->tenant_id,
            'tenant' => $token->tenant?->name,
            'table_category' => $this->localized($token->category?->name),
            'table' => $token->tableRef?->name,
            'visit_reference' => $token->visit_reference,
            'status' => $status,
            'creator' => $token->creator?->name,
            'expires_at' => $token->expires_at->toIso8601String(),
            'expires_at_human' => $token->expires_at->format('Y-m-d H:i'),
            'used_at' => $token->used_at?->toIso8601String(),
            'created_at' => $token->created_at?->toIso8601String(),
            'created_at_human' => $token->created_at?->format('Y-m-d H:i'),
        ];
    }

    /**
     * Translatable columns store {"uz":...,"ru":...,"en":...} — flatten to a
     * display string (uz-first, product default locale).
     */
    private function localized(mixed $name): ?string
    {
        if (is_array($name)) {
            return $name['uz'] ?? $name['ru'] ?? $name['en'] ?? (reset($name) ?: null);
        }

        return $name !== null ? (string) $name : null;
    }
}
