<?php

declare(strict_types=1);

return [
    'nav' => [
        'label' => 'Custom domains',
    ],
    'model' => [
        'label' => 'Domain',
        'plural' => 'Domains',
    ],
    'col' => [
        'domain' => 'Domain',
        'tenant' => 'Tenant',
        'primary' => 'Primary',
        'verification' => 'Verification',
        'ssl' => 'SSL',
        'method' => 'Method',
        'last_checked' => 'Last checked',
        'ssl_issued' => 'SSL issued',
        'created' => 'Created',
    ],
    'form' => [
        'basic' => 'Basic',
        'verification' => 'Verification',
        'routing' => 'Routing',
        'domain_help' => 'Enter the fully-qualified domain (e.g. shop.example.com).',
        'primary_help' => 'When enabled, this becomes the canonical URL.',
        'token' => 'Verification token',
        'token_help' => 'Add this token to your DNS records.',
        'redirects_to' => 'Redirects to',
        'redirects_help' => 'Optionally redirect this domain to another (e.g. www.x.uz → x.uz).',
    ],
    'status' => [
        'verified' => 'Verified',
        'pending' => 'Pending',
    ],
    'method' => [
        'txt' => 'TXT record',
        'cname' => 'CNAME',
        'txt_full' => 'TXT record (recommended)',
        'cname_full' => 'CNAME',
        'txt_help' => 'Easiest path. Does not affect existing site routing.',
        'cname_help' => 'Routes the apex through MyPOS proxy directly.',
    ],
    'ssl' => [
        'pending' => 'Pending',
        'provisioning' => 'Provisioning',
        'active' => 'Active',
        'error' => 'Error',
    ],
    'filter' => [
        'all' => 'All',
    ],
    'actions' => [
        'add' => 'Add domain',
        'reverify' => 'Re-verify',
        'set_primary' => 'Set as primary',
        'verify_selected' => 'Verify selected',
        'upgrade' => 'Upgrade to Plus',
    ],
    'upgrade' => [
        'title' => 'Plus tier required',
        'description' => 'Custom domains are available on the Plus and Enterprise tiers. Current tier: Free.',
        'cta' => 'View plans',
    ],
    'notifications' => [
        'reverify_started' => 'Re-verification started',
        'verify_started_bulk' => 'Re-verification started for selected domains',
        'primary_updated' => 'Primary domain updated',
        'verify_failed_title' => 'DNS check failed',
    ],
    'wizard' => [
        'submit' => 'Create and verify',
        'step1' => [
            'title' => 'Enter domain',
            'description' => 'Which hostname should serve your storefront?',
            'help' => 'For example: shop.example.com or menu.cafe.com',
            'method' => 'Verification method',
        ],
        'step2' => [
            'title' => 'DNS records',
            'description' => 'Add the records below at your DNS provider.',
            'intro' => 'Add the following records to your DNS configuration:',
            'note' => 'DNS propagation may take 5–60 minutes.',
            'primary' => 'Set as primary domain',
            'primary_help' => 'When enabled, your storefront URL switches to this domain.',
        ],
        'step3' => [
            'title' => 'Verify',
            'description' => 'We will check that your DNS records are correct.',
            'help' => 'When you submit, we automatically run a DNS check.',
            'status' => 'Status',
        ],
        'step4' => [
            'title' => 'SSL certificate',
            'description' => 'Once verified, we issue an SSL certificate automatically.',
            'help' => 'This usually takes 1–2 minutes. The page will refresh automatically.',
        ],
    ],
    'view' => [
        'basic' => 'Basic',
        'verification' => 'Verification',
        'ssl' => 'SSL',
        'timestamps' => 'Timestamps',
        'verified_at' => 'Verified at',
        'updated_at' => 'Updated',
        'ssl_error' => 'SSL error',
    ],
];
