<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards `/api/v1/super-admin/*` — only users with `is_super_admin = true`.
 *
 * Tenant scoping is bypassed automatically by `BelongsToTenant`'s
 * `resolveCurrentTenantId()` which returns null for super admins, so we don't
 * need to clear scopes manually here.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json([
                'message' => __('Tizimga kirish talab qilinadi'),
            ], 401);
        }

        if ((bool) $user->is_super_admin !== true) {
            return response()->json([
                'message' => __('Super admin huquqlari talab qilinadi'),
            ], 403);
        }

        // Sanctum ability check: token MUST have LITERAL 'super-admin' ability,
        // and MUST NOT carry the wildcard '*' ability.
        //
        // SECURITY: `tokenCan('super-admin')` alone returns TRUE for any token
        // with `*` ability (Sanctum treats `*` as a wildcard). A wildcard tenant
        // token would gain super-admin powers if `is_super_admin` flag was ever
        // flipped on. We explicitly reject wildcard tokens before checking the
        // specific ability.
        $token = $request->user()->currentAccessToken();
        if ($token !== null) {
            // 1) For real PersonalAccessToken, inspect the abilities DB column.
            $abilities = property_exists($token, 'abilities') && is_array($token->abilities ?? null)
                ? (array) $token->abilities
                : null;

            if ($abilities !== null) {
                if (in_array('*', $abilities, true) || ! in_array('super-admin', $abilities, true)) {
                    return response()->json([
                        'message' => __('Super admin huquqlari talab qilinadi'),
                    ], 403);
                }
            } else {
                // 2) For Sanctum::actingAs() mocks (testing) the abilities
                // property is missing. Use can() but explicitly probe for '*'
                // to detect wildcard.
                try {
                    $hasWildcard = (bool) $token->can('*');
                } catch (\Throwable) {
                    $hasWildcard = false;
                }
                if ($hasWildcard) {
                    return response()->json([
                        'message' => __('Super admin huquqlari talab qilinadi'),
                    ], 403);
                }
                if (! $request->user()->tokenCan('super-admin')) {
                    return response()->json([
                        'message' => __('Super admin huquqlari talab qilinadi'),
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
