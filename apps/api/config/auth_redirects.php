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
| Each environment (local / staging / production) provides its own URL
| via `AUTH_PORTAL_*_URL` env vars. Defaults below are dev (localhost).
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
     * Per-role landing URL.
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
     */
    'redirects' => [
        // PROXY-MODE (2026-05-23): all panels served from same origin
        // localhost:3000 via the Node.js reverse proxy in infra/proxy/server.mjs.
        // Each app has Next.js `basePath: /panel/<role>` so client-side links
        // continue to work; only the final landing URL changes here.
        //
        // To bypass the proxy in production, set the AUTH_PORTAL_*_URL env
        // vars to the subdomain form (e.g. https://admin.mypos.uz/uz/dashboard).

        // web-superadmin: dark+teal SaaS for MyPOS team
        'super_admin' => env('AUTH_PORTAL_SUPER_ADMIN_URL', 'http://localhost:3000/panel/admin/uz/dashboard'),

        // web-ceo: Apple-style multi-restaurant owner panel
        'ceo'         => env('AUTH_PORTAL_CEO_URL',         'http://localhost:3000/panel/ceo/uz/overview'),

        // web-dashboard: single-restaurant manager panel
        'owner'       => env('AUTH_PORTAL_OWNER_URL',       'http://localhost:3000/panel/manager/uz/overview'),
        'manager'     => env('AUTH_PORTAL_MANAGER_URL',     'http://localhost:3000/panel/manager/uz/overview'),

        // web-cashier: dedicated cashier POS panel — lands on the POS screen.
        'cashier'     => env('AUTH_PORTAL_CASHIER_URL',     'http://localhost:3000/panel/cashier/uz/pos'),

        // courier — POS-like /orders screen on the manager panel.
        'courier'     => env('AUTH_PORTAL_COURIER_URL',     'http://localhost:3000/panel/manager/uz/orders'),

        // web-portal: the waiter panel lives in the portal app itself
        // (same origin as login — no cross-app handoff needed).
        'waiter'      => env('AUTH_PORTAL_WAITER_URL',      'http://localhost:3000/panel/portal/uz/tables'),

        // kds: kitchen display (locale-less, just /board)
        'chef'        => env('AUTH_PORTAL_CHEF_URL',        'http://localhost:3000/panel/kitchen/board'),

        // web-consumer: /uz root (marketplace).
        'customer'    => env('AUTH_PORTAL_CUSTOMER_URL',    'http://localhost:3000/panel/consumer/uz'),
    ],

    /**
     * Fallback when role is unknown / no roles assigned.
     */
    'default' => env('AUTH_PORTAL_DEFAULT_URL', 'http://localhost:3000/panel/manager/uz/overview'),

    /**
     * Allowlist of redirect hosts — protects against open redirect attacks.
     * The portal will refuse to redirect to a URL whose host is not in this
     * list. Add tenant custom domains as they're verified.
     */
    'allowed_hosts' => array_filter(array_map('trim', explode(',', env(
        'AUTH_PORTAL_ALLOWED_HOSTS',
        'localhost,127.0.0.1,mypos.uz,app.mypos.uz,admin.mypos.uz,kitchen.mypos.uz,qr.mypos.uz,order.mypos.uz'
    )))),
];
