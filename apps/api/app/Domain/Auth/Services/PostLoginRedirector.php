<?php

declare(strict_types=1);

namespace App\Domain\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Config;

/**
 * Resolves the URL a user should be sent to immediately after a successful
 * login at the universal `web-portal` app.
 *
 * Resolution order (first match wins):
 *   1. User has `is_super_admin === true`  → super_admin redirect
 *   2. Highest-priority Spatie role        → matching `redirects` entry
 *   3. Nothing matched                     → `default`
 *
 * Every `auth_redirects` entry is a same-origin PATH, not an absolute URL —
 * the frontend resolves it against `window.location.origin` (see
 * LoginForm.tsx), so the user always lands back on whichever host they're
 * already on. `isSafePath()` is defense-in-depth against that becoming an
 * open redirect: a value starting with `//` is protocol-relative and the
 * browser's `URL()` constructor would resolve it to a *different* host.
 */
class PostLoginRedirector
{
    public function resolveFor(User $user): string
    {
        $path = $this->candidatePath($user);

        if (! $this->isSafePath($path)) {
            // Defense-in-depth — never emit a value that could resolve to
            // a host other than the one the request already came in on.
            return (string) Config::get('auth_redirects.default');
        }

        return $path;
    }

    public function resolveRoleFor(User $user): string
    {
        if (($user->is_super_admin ?? false) === true) {
            return 'super_admin';
        }

        $priority = (array) Config::get('auth_redirects.priority', []);
        $userRoles = $user->getRoleNames()->all();

        foreach ($priority as $role) {
            if (in_array($role, $userRoles, true)) {
                return $role;
            }
        }

        return 'default';
    }

    private function candidatePath(User $user): string
    {
        $role = $this->resolveRoleFor($user);
        $redirects = (array) Config::get('auth_redirects.redirects', []);

        return $redirects[$role]
            ?? (string) Config::get('auth_redirects.default');
    }

    private function isSafePath(string $path): bool
    {
        return str_starts_with($path, '/') && ! str_starts_with($path, '//');
    }
}
