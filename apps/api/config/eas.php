<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Expo Application Services (EAS) — Native App Builder
|--------------------------------------------------------------------------
|
| Configuration shared between Agent D2 (build dispatch) and Agent D3
| (post-build webhook + store submission). All values are read from .env;
| nothing here calls env() at runtime — this file is the single bridge so
| code can use config('eas.*') and remain config-cache safe.
|
| Per-MyPOS-account credentials (build_account=mypos): single set of keys
| for every tenant whose app is published under MyPOS Inc.'s umbrella.
| Per-tenant credentials (build_account=tenant): handled out-of-band — the
| tenant pastes their keys into the Filament admin, which stores them
| encrypted on tenant_apps and they bypass these defaults.
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | EAS Build webhook secret (HMAC-SHA1)
    |--------------------------------------------------------------------------
    |
    | When EAS finishes a build it POSTs to /api/v1/webhooks/eas-build with
    | header `expo-signature: sha1=<hex>` whose value is HMAC-SHA1 of the
    | raw request body keyed by this secret. The secret is set on the EAS
    | webhook configuration (one secret per project) — keep it tightly
    | scoped and rotate via Doppler/Coolify.
    |
    | If empty, the webhook controller returns 503 — fail-closed so a
    | mis-deployed environment cannot silently accept unsigned calls.
    |
    */
    'webhook_secret' => env('EAS_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | EAS API
    |--------------------------------------------------------------------------
    |
    | Used by Agent D2's EasBuildClient to dispatch builds. We only declare
    | the values here; the client is owned by D2.
    |
    */
    'api_url' => env('EAS_API_URL', 'https://api.expo.dev/v2'),
    'access_token' => env('EAS_ACCESS_TOKEN'),
    'account_name' => env('EAS_ACCOUNT_NAME', 'mypos'),
    'project_id' => env('EAS_PROJECT_ID'),

    /*
    |--------------------------------------------------------------------------
    | Build template repository (Agent D5)
    |--------------------------------------------------------------------------
    |
    | EAS clones this Git repo for every build. The dispatch payload picks a
    | specific ref (`template_ref`) so we can bump templates per environment
    | without changing application code.
    |
    */
    'template_repo' => env('EAS_TEMPLATE_REPO', 'https://github.com/mypos-uz/mobile-consumer-template'),
    'template_ref' => env('EAS_TEMPLATE_REF', 'main'),

    /*
    |--------------------------------------------------------------------------
    | HTTP timeouts (seconds) for EasBuildClient
    |--------------------------------------------------------------------------
    |
    | `dispatch_timeout` is the longer cap used when calling POST /builds —
    | EAS occasionally takes several seconds to enqueue a build.
    | `poll_timeout` covers the GETs from PollBuildStatusJob.
    |
    */
    'dispatch_timeout' => (int) env('EAS_DISPATCH_TIMEOUT', 60),
    'poll_timeout' => (int) env('EAS_POLL_TIMEOUT', 15),

    /*
    |--------------------------------------------------------------------------
    | Submission polling
    |--------------------------------------------------------------------------
    |
    | PollSubmissionStatusJob runs hourly to check Apple Review + Google
    | Review state for builds in submission_status IN ('submitted',
    | 'in_review'). Tunable here so QA can shorten the loop.
    |
    */
    'submission_poll' => [
        // How long after submission to keep polling before giving up.
        // Apple median review is 24-48h; Google is hours. 14 days is
        // generous enough to cover holiday slowdowns.
        'max_age_days' => (int) env('EAS_SUBMISSION_POLL_MAX_DAYS', 14),
    ],

];
