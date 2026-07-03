<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) — PORT-2 (2026-05-10)
|--------------------------------------------------------------------------
|
| The universal proxy (`infra/proxy/server.mjs` port 3000) routes every
| Next.js app under one origin in dev, but the raw per-app ports (3001–3008
| + 3010) are also kept open for direct access. Production: *.mypos.uz.
| All these origins need to call the Laravel
| API while sending cookies. Required pieces:
|
|   1. paths        — which API endpoints accept CORS
|   2. allowed_*    — which origins/methods/headers are permitted
|   3. supports_credentials = true — so the browser actually sends cookies
|
| Wildcards are NOT allowed when `supports_credentials = true`; we list
| every origin explicitly. Tenant custom domains are added at runtime by
| the `ResolveTenantFromDomain` middleware — they never call the API
| cross-origin in the typical flow (same-origin via Caddy reverse proxy).
*/

return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'broadcasting/auth',
    ],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        // Local dev — every Next.js app port (3008 = web-cashier), reachable
        // both as localhost and as 127.0.0.1 (browsers treat them as two
        // DIFFERENT origins, so both spellings must be listed).
        'http://localhost:3000,http://localhost:3001,http://localhost:3002,'
        . 'http://localhost:3003,http://localhost:3004,http://localhost:3005,'
        . 'http://localhost:3006,http://localhost:3007,http://localhost:3008,'
        . 'http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,'
        . 'http://127.0.0.1:3003,http://127.0.0.1:3004,http://127.0.0.1:3005,'
        . 'http://127.0.0.1:3006,http://127.0.0.1:3007,http://127.0.0.1:3008'
    )))),

    /*
     * Production wildcard pattern — accepts any *.mypos.uz subdomain.
     * Add tenant custom-domain patterns as a comma-separated list via
     * CORS_ALLOWED_ORIGIN_PATTERNS once those domains are HTTPS-verified.
     */
    'allowed_origins_patterns' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGIN_PATTERNS',
        '#^https?://[a-z0-9-]+\.mypos\.uz$#'
    )))),

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition', 'X-Request-Id'],

    /*
     * Cache preflight responses for 24h — cuts the OPTIONS round-trip
     * cost for every authenticated browser request.
     */
    'max_age' => 86400,

    /*
     * MUST be true for Sanctum SPA auth — without it the browser drops
     * the session cookie on cross-origin requests.
     */
    'supports_credentials' => true,
];
