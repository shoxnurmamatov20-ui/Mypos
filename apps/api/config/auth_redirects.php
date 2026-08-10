<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Post-Login Role Redirects (PORT-1, 2026-05-10)
|--------------------------------------------------------------------------
|
| Map every Spatie role to the URL the user lands on right after a
| successful login at the universal portal (`web-portal` app).
|
| Two layers of resolution:
|   1. `is_super_admin = true` → `super_admin` redirect (overrides everything)
|   2. Highest-priority Spatie role → entry from the `redirects` array
|
| Add new roles by extending `App\Domain\Auth\Enums\Role` AND adding a key
| here. Missing keys fall back to `default`.
|
| SAME-ORIGIN PATHS ONLY (2026-07-30): every value below is a path, not an
| absolute URL. Nginx serves the API and every Next.js panel from ONE origin
| (path-routed — see /etc/nginx/sites-available/mypos), and the frontend
| resolves this path against `window.location.origin` (LoginForm.tsx). That
| makes the redirect automatically correct on whichever host the browser is
| actually on — the default IP, a *.mypos.uz subdomain, or a tenant custom
| domain — with no per-environment host to keep in sync. A previous version
| of this file baked an absolute host into AUTH_PORTAL_*_URL, which broke
| every login whenever the app was reached via a host that didn't match it
| (mixed-content-blocked API calls, then a redirect to the wrong origin).
| Don't reintroduce a hardcoded scheme+host here.
*/

return [
    /**
     * Priority order: when a user has multiple roles, the FIRST match wins.
     * Higher in the list = wins.
     */
    'priority' => [
        'super_admin',
        'ceo',
        'owner',
        'manager',
        'cashier',
        'waiter',
        'chef',
        'courier',
        'customer',
    ],

    /**
     * Per-role landing path (same-origin, always starts with `/`).
     *
     * 2026-05-14 PORT-RESHUFFLE (MEGA-PLAN Faza 1):
     *   3000 → web-marketing   (was 3007)
     *   3001 → web-ceo         (NEW, to be created)
     *   3002 → web-consumer    (same)
     *   3003 → web-qr          (was 3005)
     *   3004 → web-superadmin  (was 3003)
     *   3005 → web-portal      (was 3000)
     *   3006 → web-dashboard   (was 3001)
     *   3007 → kds             (was 3006)
     *   3008 → web-cashier     (NEW — dedicated cashier POS panel)
     *
     * Nginx proxies each `/panel/<role>` prefix to its app (see the Next.js
     * panellari section of the nginx config) — the ports above are internal
     * only, never exposed to the browser.
     */
    'redirects' => [
        // web-superadmin: dark+teal SaaS for MyPOS team
        'super_admin' => env('AUTH_PORTAL_SUPER_ADMIN_URL', '/panel/admin/uz/dashboard'),

        // web-ceo: Apple-style multi-restaurant owner panel
        'ceo'         => env('AUTH_PORTAL_CEO_URL',         '/panel/ceo/uz/overview'),

        // web-dashboard: single-restaurant manager panel
        'owner'       => env('AUTH_PORTAL_OWNER_URL',       '/panel/manager/uz/overview'),
        'manager'     => env('AUTH_PORTAL_MANAGER_URL',     '/panel/manager/uz/overview'),

        // web-cashier: dedicated cashier POS panel — lands on the POS screen.
        'cashier'     => env('AUTH_PORTAL_CASHIER_URL',     '/panel/cashier/uz/pos'),

        // courier — POS-like /orders screen on the manager panel.
        'courier'     => env('AUTH_PORTAL_COURIER_URL',     '/panel/manager/uz/orders'),

        // web-portal: the waiter panel lives in the portal app itself
        // (same origin as login — no cross-app handoff needed).
        'waiter'      => env('AUTH_PORTAL_WAITER_URL',      '/panel/portal/uz/tables'),

        // kds: kitchen display (locale-less, just /board)
        'chef'        => env('AUTH_PORTAL_CHEF_URL',        '/panel/kitchen/board'),

        // web-consumer: /uz root (marketplace).
        'customer'    => env('AUTH_PORTAL_CUSTOMER_URL',    '/panel/consumer/uz'),
    ],

    /**
     * Fallback when role is unknown / no roles assigned.
     */
    'default' => env('AUTH_PORTAL_DEFAULT_URL', '/panel/manager/uz/overview'),
];
