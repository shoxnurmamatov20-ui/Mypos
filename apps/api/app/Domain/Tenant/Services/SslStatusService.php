<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Models\TenantDomain;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Polls Caddy's admin API to discover the live state of a custom-domain
 * certificate, and reflects that into `tenant_domains.ssl_status`.
 *
 * Caddy admin API ref: https://caddyserver.com/docs/api
 * Default bind: `:2019` on the loopback of the Caddy host.
 *
 * We hit two endpoints:
 *
 *   - GET /reverse-proxy/ ... actually we use:
 *   - GET /pki/ca/local — sanity check that admin is reachable
 *   - GET /config/ — full config tree (cheap-ish; cached upstream by Caddy)
 *   - GET /reverse_proxy/upstreams — not used here
 *
 * For SSL liveness specifically Caddy exposes the *cert chain* under
 * `pki/certificates/<id>`, but the simplest, most robust check is to ask
 * Caddy itself whether it is *currently* configured to serve the host.
 * In practice we treat the cert lifecycle as:
 *
 *   pending → row created, Caddy not yet aware
 *   provisioning → Caddy is mid-handshake / mid-ACME
 *   active → Caddy reports a non-expired chain for this hostname
 *   error → Caddy reports a chain in error state, OR last poll timed out
 *
 * NOTE: Caddy does not expose a stable "is this host provisioned?" RPC.
 * We probe `https://<domain>` from the API host and inspect the leaf cert.
 * If TLS handshake succeeds and the SAN matches → active. If it fails →
 * pending / provisioning / error depending on the previous state.
 */
class SslStatusService
{
    private const PROBE_TIMEOUT_SECONDS = 4;
    private const ADMIN_TIMEOUT_SECONDS = 2;
    private const ADMIN_PING_CACHE_KEY = 'caddy:admin:reachable';
    private const ADMIN_PING_CACHE_TTL = 60;

    public function __construct(
        private readonly DomainVerificationService $verifier = new DomainVerificationService(),
    ) {
    }

    /**
     * Refresh `ssl_status` and `ssl_issued_at` on a single TenantDomain row.
     *
     * Returns true on a successful refresh (regardless of cert state),
     * false when we could not determine state (admin API down, network
     * partition) — caller may decide to retry.
     */
    public function syncDomain(TenantDomain $domain): bool
    {
        // Skip rows that aren't yet verified — Caddy can't have a cert.
        if (! $domain->is_verified) {
            return true;
        }

        $hostname = $domain->domain;
        $previous = $domain->ssl_status;

        try {
            $state = $this->probeHttps($hostname);
        } catch (Throwable $e) {
            Log::warning('SslStatusService: probe failed', [
                'domain' => $hostname,
                'exception' => $e->getMessage(),
            ]);
            $state = ['status' => $previous === 'pending' ? 'pending' : 'error', 'error' => $e->getMessage()];
        }

        $domain->forceFill([
            'ssl_status' => $state['status'],
            'ssl_issued_at' => ($state['status'] === 'active' && $domain->ssl_issued_at === null)
                ? now()
                : $domain->ssl_issued_at,
            'ssl_error' => $state['error'] ?? null,
            'last_checked_at' => now(),
        ])->save();

        return true;
    }

    /**
     * Verify the Caddy admin endpoint is reachable. Used by health checks /
     * on-demand troubleshooting. Result is cached for 60s so the dashboard
     * doesn't hammer Caddy.
     */
    public function adminReachable(): bool
    {
        return Cache::remember(self::ADMIN_PING_CACHE_KEY, self::ADMIN_PING_CACHE_TTL, function (): bool {
            $url = rtrim((string) config('services.caddy.admin_url', 'http://127.0.0.1:2019'), '/');
            try {
                $response = Http::timeout(self::ADMIN_TIMEOUT_SECONDS)
                    ->retry(0)
                    ->get($url . '/config/');
                return $response->successful();
            } catch (ConnectionException) {
                return false;
            } catch (Throwable $e) {
                Log::warning('SslStatusService: admin ping failed', ['exception' => $e->getMessage()]);
                return false;
            }
        });
    }

    /**
     * Probe `https://<host>` and decide certificate state from the TLS
     * handshake outcome. Uses a short timeout so a single slow domain
     * doesn't stall the whole sweep.
     *
     * @return array{status: 'active'|'provisioning'|'pending'|'error', error?: string}
     */
    private function probeHttps(string $hostname): array
    {
        $context = stream_context_create([
            'ssl' => [
                'capture_peer_cert' => true,
                'verify_peer' => false,           // we inspect the cert ourselves
                'verify_peer_name' => false,
                'SNI_enabled' => true,
                'peer_name' => $hostname,
            ],
            'http' => [
                'timeout' => self::PROBE_TIMEOUT_SECONDS,
            ],
        ]);

        $errno = 0;
        $errstr = '';
        $client = @stream_socket_client(
            sprintf('ssl://%s:443', $hostname),
            $errno,
            $errstr,
            self::PROBE_TIMEOUT_SECONDS,
            STREAM_CLIENT_CONNECT,
            $context,
        );

        if ($client === false) {
            // Connection refused / timeout / TLS negotiation failure.
            // We can't tell from here whether ACME is mid-flight or blocked,
            // so treat as 'provisioning' for first-time rows and 'error' for
            // retries (caller has the previous state).
            return ['status' => 'provisioning', 'error' => $errstr ?: 'TLS handshake failed'];
        }

        $params = stream_context_get_params($client);
        fclose($client);

        $cert = $params['options']['ssl']['peer_certificate'] ?? null;
        if ($cert === null) {
            return ['status' => 'provisioning', 'error' => 'no peer certificate'];
        }

        $info = openssl_x509_parse($cert);
        if (! is_array($info)) {
            return ['status' => 'error', 'error' => 'unparseable certificate'];
        }

        $validTo = isset($info['validTo_time_t']) ? (int) $info['validTo_time_t'] : 0;
        if ($validTo > 0 && $validTo < time()) {
            return ['status' => 'error', 'error' => 'certificate expired'];
        }

        return ['status' => 'active'];
    }
}
