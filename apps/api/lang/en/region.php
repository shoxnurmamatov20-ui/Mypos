<?php

declare(strict_types=1);

/**
 * Stub translations for the Phase-4 region settings (countries, currencies,
 * exchange rates) — owned long-term by Agent E6, here so the resources render
 * with English copy until that lands.
 */

return [
    'country' => [
        'nav_label' => 'Countries',
        'model_label' => 'Country',
        'plural_label' => 'Countries',
        'section_basics' => 'Basics',
        'section_locale' => 'Locale & timezone',
        'section_status' => 'Status',
        'col_code' => 'Code',
        'col_code_help' => 'ISO 3166-1 alpha-2 (2 letters).',
        'col_name' => 'Name',
        'col_currency' => 'Currency',
        'col_default_locale' => 'Default locale',
        'col_phone_prefix' => 'Phone prefix',
        'col_timezone' => 'Timezone',
        'col_is_active' => 'Active',
        'col_launched_at' => 'Launched',
        'col_launched_at_help' => 'When MyPOS officially launched in this market.',
        'actions' => [
            'enable' => 'Enable',
            'disable' => 'Disable',
        ],
    ],
    'currency' => [
        'nav_label' => 'Currencies',
        'model_label' => 'Currency',
        'plural_label' => 'Currencies',
        'section_basics' => 'Basics',
        'section_format' => 'Format',
        'section_format_help' => 'Decimals control how amounts are rendered. UZS uses 0; most others use 2.',
        'col_code' => 'Code',
        'col_code_help' => 'ISO 4217 (3 letters).',
        'col_name' => 'Name',
        'col_symbol' => 'Symbol',
        'col_decimals' => 'Decimals',
        'col_decimals_help' => 'Number of fractional digits used in display amounts.',
        'col_is_active' => 'Active',
    ],
    'fx' => [
        'nav_label' => 'Exchange rates',
        'model_label' => 'Exchange rate',
        'plural_label' => 'Exchange rates',
        'section_basics' => 'Rate',
        'col_from' => 'From',
        'col_to' => 'To',
        'col_rate' => 'Rate',
        'col_rate_help' => '1 unit of "from" equals N units of "to".',
        'col_source' => 'Source',
        'col_rate_date' => 'Effective date',
        'col_fetched_at' => 'Fetched at',
        'filter_from' => 'From',
        'filter_until' => 'Until',
        'source' => [
            'manual' => 'Manual override',
        ],
        'actions' => [
            'refresh' => 'Refresh now',
            'refresh_confirm_title' => 'Refresh exchange rates?',
            'refresh_confirm_body' => 'This will dispatch a job to fetch the latest rates from CBU / NBP / Fixer.',
        ],
        'notifications' => [
            'refresh_dispatched' => 'Refresh dispatched',
            'refresh_failed' => 'Refresh failed',
            'job_unavailable' => 'Sync job not yet deployed',
            'job_unavailable_body' => 'SyncFxRatesJob has not been published yet.',
        ],
        'widget' => [
            'unavailable' => 'FX rates not available',
            'unavailable_help' => 'Run pending migrations.',
            'no_data' => 'No data yet',
        ],
    ],
    'tenant' => [
        'section_title' => 'Region',
        'section_description' => 'Country, currency, and timezone for this restaurant.',
        'col_country' => 'Country',
        'col_currency' => 'Currency',
    ],
];
