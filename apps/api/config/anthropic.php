<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Anthropic API key
    |--------------------------------------------------------------------------
    |
    | Server-side only — never expose to the client. Empty string disables AI
    | features at the controller layer (returns 503).
    |
    */
    'api_key' => env('ANTHROPIC_API_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Default model
    |--------------------------------------------------------------------------
    |
    | We pin to `claude-opus-4-7` for menu generation + translations because
    | the larger context + better instruction-following pays for itself versus
    | smaller variants. Override per-call if a feature only needs Sonnet.
    |
    */
    'model' => env('ANTHROPIC_MODEL', 'claude-opus-4-7'),

    /*
    |--------------------------------------------------------------------------
    | Master kill-switch
    |--------------------------------------------------------------------------
    |
    | Independent of the API key — useful for emergency stops without rotating
    | secrets. When false, the controller returns 503 with an i18n message.
    |
    */
    'enabled' => env('ANTHROPIC_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | API endpoint + version header
    |--------------------------------------------------------------------------
    */
    'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com/v1'),
    'api_version' => env('ANTHROPIC_API_VERSION', '2023-06-01'),

    /*
    |--------------------------------------------------------------------------
    | HTTP timeout (seconds)
    |--------------------------------------------------------------------------
    |
    | Menu generation can run >60s on cold caches. We bump default to 120s.
    |
    */
    'timeout' => (int) env('ANTHROPIC_TIMEOUT', 120),

    /*
    |--------------------------------------------------------------------------
    | Per-feature default token budgets
    |--------------------------------------------------------------------------
    |
    | Used by Action classes when caller doesn't pass an override. Keeping
    | them here makes cost tuning a config change rather than code.
    |
    */
    'max_tokens' => [
        'menu_generator' => 8192,
        'translator' => 2048,
        'description' => 1024,
        'default' => 4096,
    ],

    /*
    |--------------------------------------------------------------------------
    | Pricing (USD per 1M tokens) — Opus 4.7
    |--------------------------------------------------------------------------
    |
    | Used by AnthropicClient::estimateCost(). Update when Anthropic publishes
    | new pricing. Approximate values — verify against current invoices.
    |
    */
    'pricing' => [
        'claude-opus-4-7' => [
            'input' => 15.0,    // $15 per 1M input tokens
            'output' => 75.0,   // $75 per 1M output tokens
        ],
        'claude-sonnet-4' => [
            'input' => 3.0,
            'output' => 15.0,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tier-based daily request limits
    |--------------------------------------------------------------------------
    |
    | Counted against `ai_generations_log` rows for today (UTC). Per-tenant.
    | `null` means unlimited. `0` disables AI features for that tier.
    |
    */
    'daily_limits' => [
        'free' => 0,
        'pro' => 50,
        'plus' => 500,
        'enterprise' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Public onboarding rate limit (per IP, per hour)
    |--------------------------------------------------------------------------
    */
    'public_hourly_limit_per_ip' => (int) env('ANTHROPIC_PUBLIC_HOURLY_LIMIT', 5),
];
