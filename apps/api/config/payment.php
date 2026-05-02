<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Payment Webhook Hardening Config
|--------------------------------------------------------------------------
|
| Centralised flags + IP allowlists for the payment-provider webhooks
| (Click.uz, Payme/Paycom). The defaults are deliberately strict —
| anything that ships without setting `PAYMENT_ALLOW_STUB_WEBHOOKS=true`
| in a non-production environment will refuse the legacy `sign_string=stub_ok`
| / Basic-auth `stub_ok` shortcut.
|
| See SECURITY.md "C3 Webhook stub-mode bypass" and ADR-0007.
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Allow stub webhook signatures
    |--------------------------------------------------------------------------
    |
    | When TRUE the provider classes will accept the historical "stub_ok"
    | placeholder in place of a real signature whenever the relevant
    | provider secret is empty.  This MUST stay FALSE in production —
    | the provider classes additionally refuse stub mode in production
    | regardless of this flag (defence-in-depth).
    |
    | Allowed only in `local` / `testing` Laravel environments.
    |
    */
    'allow_stub_webhooks' => env('PAYMENT_ALLOW_STUB_WEBHOOKS', false),

    /*
    |--------------------------------------------------------------------------
    | Click.uz webhook
    |--------------------------------------------------------------------------
    */
    'click' => [
        // Comma-separated CIDR/IP list of Click.uz signing servers. Empty array
        // = allow all (dev mode).  TODO(production): populate with real Click
        // egress IPs documented at https://docs.click.uz/.
        'allowed_ips' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('CLICK_WEBHOOK_ALLOWED_IPS', '')),
        ))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payme (Paycom) webhook
    |--------------------------------------------------------------------------
    */
    'payme' => [
        // Comma-separated CIDR/IP list of Payme/Paycom egress.  Empty array
        // = allow all (dev mode).  TODO(production): populate with real
        // Payme egress IPs documented at https://developer.help.paycom.uz/.
        'allowed_ips' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('PAYME_WEBHOOK_ALLOWED_IPS', '')),
        ))),
    ],

];
