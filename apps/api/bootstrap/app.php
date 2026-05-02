<?php

use App\Http\Middleware\EnsureActiveStaff;
use App\Http\Middleware\EnsureKioskDevice;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureTenantAdmin;
use App\Http\Middleware\InternalCaddyOnly;
use App\Http\Middleware\PaymentWebhookIpAllowlist;
use App\Http\Middleware\ResolveTenantFromDomain;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

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
        // Append ResolveTenantFromDomain BEFORE SetTenantContext: it inspects
        // the Host header for a custom restaurant domain (e.g. jomeburger.uz)
        // and binds the matching Tenant into the container as `currentTenant`.
        // SetTenantContext then picks that up to set the `app.current_tenant_id`
        // GUC for PostgreSQL RLS — auth-derived tenants still take priority,
        // and for our own platform hostnames the resolver passes through.
        $middleware->api(append: [
            ResolveTenantFromDomain::class,
            SetTenantContext::class,
        ]);

        $middleware->alias([
            'staff.scope' => EnsureActiveStaff::class,
            'kiosk.device' => EnsureKioskDevice::class,
            'super-admin' => EnsureSuperAdmin::class,
            'tenant.admin' => EnsureTenantAdmin::class,
            'payment.webhook.ips' => PaymentWebhookIpAllowlist::class,
            'tenant.context' => SetTenantContext::class,
            'tenant.domain' => ResolveTenantFromDomain::class,
            'internal.caddy' => InternalCaddyOnly::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
