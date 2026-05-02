<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Internal;

use App\Domain\Tenant\Models\TenantDomain;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Caddy "ask" endpoint for on-demand TLS.
 *
 * Caddy invokes this URL **before** initiating an ACME challenge for an
 * unknown SNI hostname. We answer 200 only when the hostname is a verified,
 * live custom domain. This is the gate that prevents an attacker from
 * pointing arbitrary domains at our IPs and triggering unbounded
 * Let's Encrypt issuance.
 *
 * Caddy contract:
 *   - GET request, query param `?domain=foo.example.com`
 *   - 200 OK   → allow ACME issuance
 *   - any non-2xx → deny (Caddy will not request a cert)
 *
 * Latency budget: this is on the TLS hot path. We hit a 60s Redis cache
 * before falling back to PostgreSQL, which keeps median latency well
 * under 5ms even during a cold ACME storm.
 */
class CaddyVerifyController extends Controller
{
    private const CACHE_TTL_SECONDS = 60;

    public function verify(Request $request): Response
    {
        $domain = strtolower(trim((string) $request->query('domain', '')));

        if ($domain === '' || ! $this->looksLikeHostname($domain)) {
            return response('Bad domain', 400);
        }

        if ($this->isAllowed($domain)) {
            return response('OK', 200);
        }

        return response('Not allowed', 404);
    }

    private function isAllowed(string $domain): bool
    {
        $cacheKey = 'caddy:verify:' . $domain;

        $cached = Cache::get($cacheKey);
        if ($cached === 'allow') {
            return true;
        }
        if ($cached === 'deny') {
            return false;
        }

        $exists = TenantDomain::query()
            ->withoutGlobalScopes()
            ->where('domain', $domain)
            ->where('is_verified', true)
            ->whereNull('deleted_at')
            ->exists();

        Cache::put($cacheKey, $exists ? 'allow' : 'deny', self::CACHE_TTL_SECONDS);

        return $exists;
    }

    /**
     * Cheap sanity check — block obvious garbage before hitting Redis/DB.
     * Real DNS-name validation happens at insert time in the verification
     * service; this is just to filter out crawler probes.
     */
    private function looksLikeHostname(string $domain): bool
    {
        if (strlen($domain) > 253 || strlen($domain) < 3) {
            return false;
        }
        // Must contain at least one dot, no scheme, no path, no whitespace.
        if (! str_contains($domain, '.')) {
            return false;
        }
        if (preg_match('/[\s\/\\\\:?#@]/', $domain) === 1) {
            return false;
        }
        return preg_match('/^[a-z0-9.-]+$/i', $domain) === 1;
    }
}
