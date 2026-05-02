<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Auth\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards `/api/v1/admin/*` — restaurant-owner self-service surface.
 *
 * Allow when the authenticated user:
 *   - has a non-null `tenant_id` (so super-admins are *not* allowed here;
 *     the platform team has its own panel under `/api/v1/super-admin/*`),
 *   - holds either the `owner` or `manager` role (spatie/laravel-permission).
 *
 * NOTE: Some endpoints (custom domains, tier billing) further restrict to
 * Owner only — those checks live in the per-resource Policy, not here.
 */
class EnsureTenantAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => __('Tizimga kirish talab qilinadi'),
            ], 401);
        }

        // Super-admins use a different panel — fail closed here so a stolen
        // SA token cannot accidentally mutate restaurant-owner brand state.
        if (($user->is_super_admin ?? false) === true) {
            return response()->json([
                'message' => __('Bu endpoint restoran egalari uchun'),
            ], 403);
        }

        if (empty($user->tenant_id)) {
            return response()->json([
                'message' => __('Sizda restoran biriktirilmagan'),
            ], 403);
        }

        if (! $user->hasAnyRole([Role::Owner->value, Role::Manager->value])) {
            return response()->json([
                'message' => __('Faqat egasi yoki menejer kirishi mumkin'),
            ], 403);
        }

        return $next($request);
    }
}
