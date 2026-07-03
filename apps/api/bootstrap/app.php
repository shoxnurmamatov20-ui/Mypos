<?php

use App\Http\Middleware\EnsureActiveStaff;
use App\Http\Middleware\EnsureCEO;
use App\Http\Middleware\EnsureKioskDevice;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureTenantAdmin;
use App\Http\Middleware\InternalCaddyOnly;
use App\Http\Middleware\PaymentWebhookIpAllowlist;
use App\Http\Middleware\ResolveTenantFromDomain;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [
            ResolveTenantFromDomain::class,
            SetTenantContext::class,
        ]);

        // Laravel re-sorts every route's middleware stack against the kernel
        // priority list, so ARRAY POSITION above is not execution order. Two
        // constraints matter under the non-owner RLS runtime (ADR-0006):
        //
        //   1. AFTER Authenticate — `$request->user()` resolves via the
        //      DEFAULT guard; only `auth:sanctum` (via shouldUse) makes the
        //      bearer token visible there. Run earlier and every request
        //      looks anonymous: no GUC, zero rows on strict tables.
        //   2. BEFORE SubstituteBindings — implicit route-model binding runs
        //      its SELECT inside that middleware; without the GUC already
        //      set, every /{model} route 404s even for the owning tenant.
        //
        // ResolveTenantFromDomain first (binds `currentTenant` from a custom
        // restaurant Host header), then SetTenantContext writes the GUC.
        $middleware->prependToPriorityList(
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            ResolveTenantFromDomain::class,
        );
        $middleware->prependToPriorityList(
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            SetTenantContext::class,
        );

        $middleware->alias([
            'staff.scope' => EnsureActiveStaff::class,
            'kiosk.device' => EnsureKioskDevice::class,
            'super-admin' => EnsureSuperAdmin::class,
            'tenant.admin' => EnsureTenantAdmin::class,
            'ceo' => EnsureCEO::class,
            'payment.webhook.ips' => PaymentWebhookIpAllowlist::class,
            'tenant.context' => SetTenantContext::class,
            'tenant.domain' => ResolveTenantFromDomain::class,
            'internal.caddy' => InternalCaddyOnly::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Error tracking — no-op until SENTRY_LARAVEL_DSN is set (Doppler/
        // Coolify). Registered first so custom render callbacks below still
        // shape the HTTP response afterwards.
        \Sentry\Laravel\Integration::handles($exceptions);

        // API hardening (2026-05-14): force JSON response shape for every
        // /api/* request. This makes the default AuthenticationException
        // return a clean 401 JSON instead of trying to redirect to a
        // nonexistent `login` route (which surfaced as a 500 to curl/SDK
        // callers that forgot to set `Accept: application/json`).
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Don't leak internal model FQCNs ("No query results for model
        // [App\Domain\...\Order] <uuid>") to API consumers — a localized,
        // generic 404 body carries exactly as much information as a guest
        // (or another tenant probing ids) is entitled to. Hooked at the
        // Symfony level because the framework wraps ModelNotFoundException
        // into NotFoundHttpException before render callbacks run.
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => __('Resurs topilmadi'),
                ], 404);
            }

            return null;
        });
    })->create();
