<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\DomainVerificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Performs the blocking DNS lookup for a TenantDomain row and writes the
 * outcome back. MUST run on a queue — `dns_get_record()` is synchronous
 * and can stall an HTTP request for several seconds on cold caches.
 *
 * Failure handling:
 *   - DNS NXDOMAIN / mismatch → row stays unverified; the dashboard shows
 *     a "Try again" button that re-dispatches this job.
 *   - Job errors → up to 3 retries with 30s back-off (queue worker config).
 *
 * The job is `NotTenantAware` because it loads the domain row by primary
 * key with `withoutGlobalScopes()` — it must work for super-admin tooling
 * which has no current tenant.
 */
class VerifyDomainJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public readonly string $tenantDomainId,
    ) {
    }

    public function handle(DomainVerificationService $verifier): void
    {
        $domain = TenantDomain::query()
            ->withoutGlobalScopes()
            ->whereKey($this->tenantDomainId)
            ->first();

        if ($domain === null) {
            Log::info('VerifyDomainJob: row not found, skipping', [
                'id' => $this->tenantDomainId,
            ]);
            return;
        }

        if ($domain->is_verified) {
            // Idempotent — once verified, stay verified. Re-verification
            // requires explicitly clearing `is_verified` first.
            return;
        }

        $hostname = strtolower($domain->domain);
        $verified = match ($domain->verification_method) {
            'cname' => $verifier->verifyCnameRecord($hostname),
            default => $verifier->verifyTxtRecord($hostname, $domain->verification_token),
        };

        $now = now();

        if ($verified) {
            $domain->forceFill([
                'is_verified' => true,
                'verified_at' => $now,
                'last_checked_at' => $now,
                'ssl_status' => 'provisioning',
            ])->save();

            // Bust the lookup caches so live routing & the Caddy verify
            // endpoint pick up the new domain on the next request.
            Cache::forget('tenant_domain:' . $hostname);
            Cache::forget('caddy:verify:' . $hostname);

            Log::info('VerifyDomainJob: domain verified', [
                'id' => $domain->id,
                'domain' => $hostname,
                'method' => $domain->verification_method,
            ]);
            return;
        }

        $domain->forceFill([
            'last_checked_at' => $now,
        ])->save();

        Log::info('VerifyDomainJob: verification failed', [
            'id' => $domain->id,
            'domain' => $hostname,
            'method' => $domain->verification_method,
        ]);
    }
}
