<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\SslStatusService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\NotTenantAware;
use Throwable;

/**
 * Hourly sweep of every verified TenantDomain. Probes the live HTTPS
 * endpoint and reflects the cert state into `tenant_domains.ssl_status`.
 *
 * Scheduling: see `routes/console.php` — runs hourly with
 * `withoutOverlapping()` to avoid stacking sweeps when DNS is slow.
 *
 * Per-row work runs inside a try/catch so a single bad domain (e.g. owner
 * un-pointed DNS mid-sweep) cannot poison the whole batch.
 *
 * Pagination: chunkById to keep memory bounded as the customer base grows.
 */
class SyncSslStatusJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 300; // 5 min — bounded by per-row 4s probe timeout

    private const CHUNK_SIZE = 100;

    public function handle(SslStatusService $sslStatus): void
    {
        TenantDomain::query()
            ->withoutGlobalScopes()
            ->where('is_verified', true)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->chunkById(self::CHUNK_SIZE, function ($domains) use ($sslStatus): void {
                foreach ($domains as $domain) {
                    try {
                        $sslStatus->syncDomain($domain);
                    } catch (Throwable $e) {
                        Log::warning('SyncSslStatusJob: row failed', [
                            'id' => $domain->id,
                            'domain' => $domain->domain,
                            'exception' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }
}
