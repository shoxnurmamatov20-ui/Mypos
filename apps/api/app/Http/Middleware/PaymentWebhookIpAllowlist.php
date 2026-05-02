<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts payment-provider webhook traffic to known egress IPs/CIDRs.
 *
 * The allowlist is keyed by the route parameter `provider` ("click"|"payme")
 * which we accept either via `$request->route('provider')` or via the
 * middleware parameter (`->middleware('payment.webhook.ips:click')`).
 *
 * Behaviour:
 * - Empty config => allow all (development/local mode).
 * - Non-empty config => match against `Symfony\IpUtils::checkIp()` (supports
 *   CIDR notation, e.g. `185.18.114.0/24`).
 * - Reject => 403 + critical log entry so SecOps can investigate.
 *
 * TODO(production): populate `config/payment.php` `click.allowed_ips` and
 * `payme.allowed_ips` with the real provider egress ranges before going live.
 * Until then this middleware is a defence-in-depth NO-OP for dev environments.
 *
 * Trust note: this middleware honours the framework's trusted-proxies config
 * (`Request::getClientIps()`) — make sure `App\Http\Middleware\TrustProxies`
 * (or `withTrustedProxies()` in bootstrap) is configured in production so
 * `$request->ip()` is the real Click/Payme egress, not your load balancer.
 */
class PaymentWebhookIpAllowlist
{
    public function handle(Request $request, Closure $next, string $provider = ''): Response
    {
        $providerKey = $provider !== ''
            ? $provider
            : (string) $request->route('provider');

        if ($providerKey === '') {
            // No provider hint: fail-closed in production, fail-open elsewhere
            // so a misconfigured route doesn't 500 a developer machine.
            if (app()->environment('production')) {
                Log::critical('PaymentWebhookIpAllowlist: no provider key on payment webhook route', [
                    'ip' => $request->ip(),
                    'path' => $request->path(),
                ]);

                return response()->json(['message' => 'Forbidden'], 403);
            }

            return $next($request);
        }

        $allowed = (array) config('payment.' . $providerKey . '.allowed_ips', []);

        // Empty allowlist = dev/local mode, allow all. Production should never
        // boot with an empty list — but we don't enforce that here to avoid
        // chicken-and-egg deploy issues (operators may be probing first).
        if ($allowed === []) {
            return $next($request);
        }

        $clientIp = (string) $request->ip();

        if (! IpUtils::checkIp($clientIp, $allowed)) {
            Log::warning('PaymentWebhookIpAllowlist: rejected webhook from unauthorised IP', [
                'provider' => $providerKey,
                'ip' => $clientIp,
                'allowed_count' => count($allowed),
            ]);

            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
