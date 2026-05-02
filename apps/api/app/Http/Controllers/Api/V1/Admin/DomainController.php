<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenant\Actions\CreateCustomDomainAction;
use App\Domain\Tenant\Actions\VerifyDomainAction;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Admin\CreateDomainRequest;
use App\Http\Resources\V1\Admin\DomainResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Custom domain management for restaurant owners.
 *
 * Read access: owner + manager (managers need visibility into SSL state for
 * support). Write access: owner only — see {@see TenantDomainPolicy}.
 */
class DomainController extends Controller
{
    public function __construct(
        private readonly CreateCustomDomainAction $createDomain,
        private readonly VerifyDomainAction $verifyDomain,
    ) {
    }

    /** GET /api/v1/admin/domains — list tenant's domains. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TenantDomain::class);

        $domains = TenantDomain::query()
            ->orderByDesc('is_primary')
            ->orderBy('created_at')
            ->get();

        return DomainResource::collection($domains);
    }

    /**
     * GET /api/v1/admin/domains/{id}
     *
     * Single-row lookup. Cross-tenant probes intentionally return 404 (and
     * not 403) so an attacker cannot enumerate live domain ids by status.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $domain = $this->findOwnedDomain($id);
        $this->authorize('view', $domain);

        return response()->json([
            'data' => DomainResource::make($domain),
        ]);
    }

    /** POST /api/v1/admin/domains — register a new custom domain. */
    public function store(CreateDomainRequest $request): JsonResponse
    {
        $this->authorize('create', TenantDomain::class);

        $tenant = $this->resolveTenant($request);
        $domain = $this->createDomain->execute($tenant, $request->validated());

        return response()->json([
            'data' => DomainResource::make($domain),
        ], Response::HTTP_CREATED);
    }

    /** POST /api/v1/admin/domains/{id}/verify — trigger DNS check. */
    public function verify(Request $request, string $id): JsonResponse
    {
        $domain = $this->findOwnedDomain($id);
        $this->authorize('verify', $domain);

        $result = $this->verifyDomain->execute($domain);

        return response()->json([
            'data' => DomainResource::make($result['domain']),
            'meta' => [
                'verified' => $result['verified'],
                'reason' => $result['reason'],
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/domains/{id}/set-primary
     *
     * The PostgreSQL partial unique index `tenant_domains_primary_uq` enforces
     * one primary per tenant — we still flip the prior primary's flag in a
     * transaction to keep DB writes idempotent on backends without partial
     * indexes (e.g. SQLite test runner).
     */
    public function setPrimary(Request $request, string $id): JsonResponse
    {
        $domain = $this->findOwnedDomain($id);
        $this->authorize('setPrimary', $domain);

        DB::transaction(function () use ($domain): void {
            TenantDomain::query()
                ->where('tenant_id', $domain->tenant_id)
                ->where('id', '!=', $domain->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);

            $domain->forceFill(['is_primary' => true])->save();
        });

        $this->bustResolverCache($domain->domain);

        return response()->json([
            'data' => DomainResource::make($domain->fresh() ?? $domain),
        ]);
    }

    /** DELETE /api/v1/admin/domains/{id} — soft-delete the domain. */
    public function destroy(Request $request, string $id): Response
    {
        $domain = $this->findOwnedDomain($id);
        $this->authorize('delete', $domain);

        $hostname = $domain->domain;
        $domain->delete();

        // Bust the resolver cache so the dropped hostname stops routing
        // immediately. Caddy will eventually reap the cert on its own.
        $this->bustResolverCache($hostname);

        return response()->noContent();
    }

    private function findOwnedDomain(string $id): TenantDomain
    {
        return TenantDomain::query()
            ->where('id', $id)
            ->firstOrFail();
    }

    private function resolveTenant(Request $request): Tenant
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        return Tenant::query()->whereKey($user->tenant_id)->firstOrFail();
    }

    private function bustResolverCache(string $hostname): void
    {
        try {
            Cache::forget('tenant_domain:' . strtolower($hostname));
        } catch (\Throwable) {
            // Best-effort; do not fail the user's request.
        }
    }
}
