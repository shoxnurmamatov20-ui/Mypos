<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for `/api/internal/caddy/*` endpoints.
 *
 * Caddy queries this API on every TLS handshake for an unknown hostname
 * (on-demand TLS), so we must (a) keep latency low and (b) refuse traffic
 * from anywhere that is not Caddy itself.
 *
 * Two independent acceptance paths — either is sufficient:
 *
 *   1. Shared-secret header: `X-Caddy-Token` must equal `config('app.caddy_secret')`.
 *      This is the path used when Caddy and the API are on different hosts
 *      (e.g. Caddy on the edge, API behind it).
 *
 *   2. Loopback IP: the request comes from 127.0.0.1 / ::1 — used in dev
 *      and when Caddy is colocated with the API on the same node.
 *
 * Production hardening:
 *   - If `CADDY_INTERNAL_TOKEN` is unset in production we DENY by default
 *     (fail-closed). Empty secret + remote caller = open verify endpoint =
 *     unbounded ACME issuance for anyone with the URL.
 *   - All rejections are logged at WARNING with the offending IP so the
 *     SOC can flag scanners.
 */
class InternalCaddyOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->hasValidToken($request)) {
            return $next($request);
        }

        if ($this->isLoopback($request)) {
            // In production we still require a secret unless explicitly
            // configured to trust loopback (e.g. unix-socket / sidecar).
            if (! app()->environment('production') || $this->loopbackTrustedInProd()) {
                return $next($request);
            }
        }

        Log::warning('InternalCaddyOnly: rejected request', [
            'ip' => $request->ip(),
            'path' => $request->path(),
            'has_header' => $request->headers->has('X-Caddy-Token'),
        ]);

        return $this->denied();
    }

    private function hasValidToken(Request $request): bool
    {
        $expected = (string) config('app.caddy_secret', '');
        if ($expected === '') {
            return false;
        }

        $provided = (string) $request->header('X-Caddy-Token', '');
        if ($provided === '') {
            return false;
        }

        // Constant-time comparison to defeat timing oracles.
        return hash_equals($expected, $provided);
    }

    /**
     * Loopback OR private-network IP (RFC1918 / fc00::/7).
     *
     * Caddy v2's `on_demand_tls.ask` directive cannot send custom headers,
     * so when Caddy and the API run on the same Docker bridge network, the
     * request comes from a 172.x.x.x / 10.x.x.x address — not 127.0.0.1.
     * Treat private-network IPs as "loopback-equivalent" but ONLY when the
     * `caddy_trust_loopback` flag is on.
     */
    private function isLoopback(Request $request): bool
    {
        $ip = (string) $request->ip();
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return true;
        }

        // Private-network detection (docker bridge, k8s service IP).
        if (filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) === false && filter_var($ip, FILTER_VALIDATE_IP) !== false) {
            // It's a valid IP that is private OR reserved — accept under
            // the same trust flag as loopback.
            return true;
        }

        return false;
    }

    private function loopbackTrustedInProd(): bool
    {
        return (bool) config('app.caddy_trust_loopback', false);
    }

    private function denied(): JsonResponse
    {
        return response()->json([
            'message' => __('Forbidden'),
        ], 403);
    }
}
