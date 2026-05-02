<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Actions;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\DomainVerificationService;
use Illuminate\Support\Facades\DB;

/**
 * Register a new custom domain for the tenant.
 *
 * Tier-gating, uniqueness, and shape validation happen in the FormRequest;
 * by the time this action runs the payload is trustworthy. The action's job is:
 *
 *   1. Generate a fresh DNS verification token (via Agent C2's service).
 *   2. Persist the row in `pending` SSL state.
 *   3. Return the domain so the controller can render the user-facing
 *      DNS instructions in the response envelope.
 *
 * The actual TXT/CNAME probing happens asynchronously — see
 * {@see VerifyDomainAction} (called from the explicit verify endpoint, plus
 * a background sweep job that re-checks pending rows every few minutes).
 */
final class CreateCustomDomainAction
{
    public function __construct(
        private readonly DomainVerificationService $verifier = new DomainVerificationService(),
    ) {
    }

    /**
     * @param  array{
     *     domain: string,
     *     verification_method?: string,
     *     redirects_to?: string|null,
     * }  $data
     */
    public function execute(Tenant $tenant, array $data): TenantDomain
    {
        return DB::transaction(function () use ($tenant, $data): TenantDomain {
            // Re-claiming a soft-deleted row is a common flow — owner removed
            // a domain, then re-added it. Restore + reset state instead of
            // creating a new row so audit history stays intact.
            $existing = TenantDomain::query()
                ->withoutGlobalScopes()
                ->withTrashed()
                ->where('domain', $data['domain'])
                ->first();

            $token = $this->verifier->generateVerificationToken();

            if ($existing !== null) {
                $existing->forceFill([
                    'tenant_id' => $tenant->id,
                    'verification_method' => $data['verification_method'] ?? 'txt',
                    'verification_token' => $token,
                    'is_verified' => false,
                    'verified_at' => null,
                    'ssl_status' => 'pending',
                    'ssl_issued_at' => null,
                    'ssl_error' => null,
                    'last_checked_at' => null,
                    'redirects_to' => $data['redirects_to'] ?? null,
                    'deleted_at' => null,
                ])->save();

                return $existing->fresh() ?? $existing;
            }

            $domain = new TenantDomain();
            $domain->forceFill([
                'tenant_id' => $tenant->id,
                'domain' => $data['domain'],
                'is_primary' => false,
                'is_verified' => false,
                'verification_method' => $data['verification_method'] ?? 'txt',
                'verification_token' => $token,
                'ssl_status' => 'pending',
                'redirects_to' => $data['redirects_to'] ?? null,
            ])->save();

            return $domain->fresh() ?? $domain;
        });
    }
}
