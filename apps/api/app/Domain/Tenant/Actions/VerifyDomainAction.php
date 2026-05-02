<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Actions;

use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\DomainVerificationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Trigger DNS verification on a custom domain row.
 *
 * Strategy:
 *   - For TXT method: probe `_mypos.<domain>` and compare against the row's
 *     `verification_token`.
 *   - For CNAME method: ensure CNAME target ends in `mypos.uz`.
 *
 * On success: mark `is_verified = true`, transition `ssl_status` to
 * `provisioning` so the Caddy/ACME background job picks the row up. On
 * failure: keep the row pending and surface the reason via `ssl_error`.
 *
 * Returns a tuple: the refreshed domain row + a structured result so the
 * controller can return a richer JSON envelope without re-doing any work.
 *
 * NOTE: `dns_get_record()` is blocking. In production this action runs
 * via a queued job; HTTP-triggered manual verification (the "Verify now"
 * button in the dashboard) accepts the latency cost in exchange for an
 * immediate yes/no answer.
 */
final class VerifyDomainAction
{
    public function __construct(
        private readonly DomainVerificationService $verifier = new DomainVerificationService(),
    ) {
    }

    /**
     * @return array{
     *     domain: TenantDomain,
     *     verified: bool,
     *     reason: string|null,
     * }
     */
    public function execute(TenantDomain $domain): array
    {
        $verified = false;
        $reason = null;

        if ($domain->verification_method === 'cname') {
            $verified = $this->verifier->verifyCnameRecord($domain->domain);
            if (! $verified) {
                $reason = 'CNAME target does not point to *.mypos.uz';
            }
        } else {
            // Default to TXT — covers historic rows where method was empty.
            $verified = $this->verifier->verifyTxtRecord(
                $domain->domain,
                (string) $domain->verification_token,
            );
            if (! $verified) {
                $reason = sprintf(
                    'TXT record at _mypos.%s did not return the expected token',
                    $domain->domain,
                );
            }
        }

        DB::transaction(function () use ($domain, $verified, $reason): void {
            $payload = [
                'last_checked_at' => now(),
            ];

            if ($verified) {
                $payload['is_verified'] = true;
                $payload['verified_at'] = $domain->verified_at ?? now();
                // Hand off to Caddy ACME via the SSL provisioner job.
                $payload['ssl_status'] = $domain->ssl_status === 'active'
                    ? 'active'
                    : 'provisioning';
                $payload['ssl_error'] = null;
            } else {
                $payload['ssl_error'] = $reason;
            }

            $domain->forceFill($payload)->save();
        });

        // Bust the resolver cache used by ResolveTenantFromDomain so a
        // freshly-verified domain becomes routable within ~1 second instead
        // of waiting for the 60-second negative-cache TTL to expire.
        $this->bustResolverCache($domain->domain);

        return [
            'domain' => $domain->fresh() ?? $domain,
            'verified' => $verified,
            'reason' => $verified ? null : $reason,
        ];
    }

    private function bustResolverCache(string $hostname): void
    {
        try {
            Cache::forget('tenant_domain:' . strtolower($hostname));
        } catch (\Throwable) {
            // Cache backend may be down — swallow.
        }
    }
}
