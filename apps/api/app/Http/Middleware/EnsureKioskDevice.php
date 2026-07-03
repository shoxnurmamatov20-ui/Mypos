<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Support\TenantGuc;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates `/api/v1/kiosk/*` requests via a Bearer device token. The
 * token is SHA-256 hashed at rest (see {@see KioskDevice::hashToken()}) so
 * lookup is O(log n) on the unique index `kiosk_devices_token_hash_uq`.
 *
 * On success: attaches the resolved {@see KioskDevice} to the request as
 * `kiosk_device` and binds it as the current tenant in the container so any
 * downstream code can resolve `tenant_id` without an authenticated User.
 */
class EnsureKioskDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if ($token === null || $token === '') {
            return response()->json([
                'message' => __('Qurilma tokeni talab qilinadi'),
            ], 401);
        }

        $hash = KioskDevice::hashToken($token);

        $device = KioskDevice::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('device_token_hash', $hash)
            ->where('status', KioskDeviceStatus::Paired->value)
            ->whereNull('deleted_at')
            ->first();

        if ($device === null) {
            return response()->json([
                'message' => __('Token noto\'g\'ri yoki bekor qilingan'),
            ], 401);
        }

        $request->attributes->set('kiosk_device', $device);

        // Bind tenant in container so downstream services that resolve a
        // current tenant from the container (e.g. spatie/laravel-multitenancy
        // helpers) can find it without an authenticated User.
        app()->instance('currentTenant', $device->tenant);

        // Route middleware runs AFTER the group-level SetTenantContext, so
        // the RLS GUC must be imprinted here for device-authed requests.
        TenantGuc::imprint((string) $device->tenant_id);

        return $next($request);
    }
}
