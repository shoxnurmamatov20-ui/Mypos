<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'click' => [
        'service_id' => env('CLICK_SERVICE_ID'),
        'merchant_id' => env('CLICK_MERCHANT_ID'),
        'secret_key' => env('CLICK_SECRET_KEY'),
        'merchant_user_id' => env('CLICK_MERCHANT_USER_ID'),
    ],

    'payme' => [
        'merchant_id' => env('PAYME_MERCHANT_ID'),
        'secret_key' => env('PAYME_SECRET_KEY'),
        'test_mode' => env('PAYME_TEST_MODE', true),
    ],

    'eskiz' => [
        'base_url' => env('ESKIZ_BASE_URL', 'https://notify.eskiz.uz/api'),
        'email' => env('ESKIZ_EMAIL'),
        'password' => env('ESKIZ_PASSWORD'),
    ],

    'expo' => [
        'push_url' => env('EXPO_PUSH_URL', 'https://exp.host/--/api/v2/push/send'),
        'access_token' => env('EXPO_ACCESS_TOKEN'),
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'bot_username' => env('TELEGRAM_BOT_USERNAME'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Caddy reverse proxy — admin API
    |--------------------------------------------------------------------------
    |
    | Used by SslStatusService to poll the cert lifecycle and surface state
    | in the dashboard. Default is the loopback bind on the Caddy host; set
    | to an internal URL when Caddy and the API are on different nodes.
    |
    */

    'caddy' => [
        'admin_url' => env('CADDY_ADMIN_URL', 'http://127.0.0.1:2019'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Apple App Store Connect API
    |--------------------------------------------------------------------------
    |
    | Used by AppStoreConnectClient (Agent D3) for builds owned by MyPOS Inc.
    | (build_account=mypos). Per-tenant developer accounts are handled
    | separately — those credentials live encrypted on tenant_apps.
    |
    | `private_key` is the contents of the AuthKey_<KEY_ID>.p8 file Apple
    | provides when generating an App Store Connect API key. Store it base64-
    | encoded in env so newlines survive the shell round-trip; the client
    | will base64-decode at instantiation.
    |
    */
    'apple_app_store' => [
        'issuer_id' => env('APPLE_ASC_ISSUER_ID'),
        'key_id' => env('APPLE_ASC_KEY_ID'),
        // Base64-encoded contents of the AuthKey_<KEY_ID>.p8 file.
        'private_key' => env('APPLE_ASC_PRIVATE_KEY'),
        // App Store Connect API base URL — overridable for tests / sandbox.
        'base_url' => env('APPLE_ASC_BASE_URL', 'https://api.appstoreconnect.apple.com'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Play Developer API
    |--------------------------------------------------------------------------
    |
    | Service-account JSON for the Play Console project. Generated in Google
    | Cloud Console → IAM → Service Accounts. Grant the account the "Service
    | Account User" + "Release manager" roles in Play Console.
    |
    | Stored base64-encoded so multi-line JSON survives env serialization.
    |
    */
    'google_play' => [
        // Base64-encoded JSON blob of the service-account credentials.
        'service_account_json' => env('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'),
        // Track to roll new builds onto: production | beta | alpha | internal.
        'default_track' => env('GOOGLE_PLAY_DEFAULT_TRACK', 'internal'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Fixer.io — FX rate fallback (Phase 4)
    |--------------------------------------------------------------------------
    |
    | Used by SyncFxRatesJob when the central-bank providers (CBU, NBP, NBKR)
    | return empty results. Free tier returns EUR-base rates only; paid plan
    | unlocks the `base=` override. Leave the key empty in dev — the
    | FixerRateProvider degrades to a static stub dataset.
    |
    */
    'fixer' => [
        'access_key' => env('FIXER_ACCESS_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Web-portal URLs
    |--------------------------------------------------------------------------
    |
    | The Laravel API renders no web pages; password-reset emails deep-link
    | into the universal portal SPA instead.
    |
    */
    'portal' => [
        'forgot_url' => env(
            'AUTH_PORTAL_FORGOT_URL',
            'http://localhost:3000/panel/portal/uz/reset-password',
        ),
    ],

];
