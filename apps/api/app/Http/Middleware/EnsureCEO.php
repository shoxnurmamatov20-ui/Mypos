<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Auth\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards `/api/v1/ceo/*` — multi-restaurant business-owner surface.
 *
 * Allow when the authenticated user:
 *   - has the `ceo` role (Spatie permission), AND
 *   - owns at least one tenant via the `tenant_owners` pivot.
 *
 * Unlike `EnsureTenantAdmin`, this middleware allows the user to operate
 * cross-tenant — they see consolidated KPIs across every restaurant they
 * own. Per-resource scoping (which specific restaurants they can mutate)
 * is enforced by `ownedTenantIds()` + scoped queries in the controllers.
 */
class EnsureCEO
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => __('Tizimga kirish talab qilinadi'),
            ], 401);
        }

        if (! $user->hasRole(Role::Ceo->value)) {
            return response()->json([
                'message' => __('Bu endpoint faqat CEO/Direktor uchun'),
            ], 403);
        }

        // Defense-in-depth: a CEO with zero owned tenants cannot proceed
        // (their dashboard would 0-out anyway and the cross-tenant query
        // helpers would return nothing).
        $ownedCount = $user->ownedTenants()->count();
        if ($ownedCount === 0) {
            return response()->json([
                'message' => __('Sizga biriktirilgan restoran topilmadi'),
            ], 403);
        }

        return $next($request);
    }
}
