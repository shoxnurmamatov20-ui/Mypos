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
 * The host of the returned URL is also validated against
 * `auth_redirects.allowed_hosts` to prevent open-redirect XSS via crafted
 * URLs ending up in the response body.
 */
class PostLoginRedirector
{
    public function resolveFor(User $user): string
    {
        $url = $this->candidateUrl($user);

        if (! $this->hostIsAllowed($url)) {
            // Defense-in-depth — never emit an external URL we don't control.
            return (string) Config::get('auth_redirects.default');
        }

        return $url;
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

    private function candidateUrl(User $user): string
    {
        $role = $this->resolveRoleFor($user);
        $redirects = (array) Config::get('auth_redirects.redirects', []);

        return $redirects[$role]
            ?? (string) Config::get('auth_redirects.default');
    }

    private function hostIsAllowed(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return false;
        }

        $allowed = (array) Config::get('auth_redirects.allowed_hosts', []);
        foreach ($allowed as $entry) {
            if ($host === $entry || str_ends_with($host, '.' . $entry)) {
                return true;
            }
        }

        return false;
    }
}
