<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantDomainResource\Schemas;

use Filament\Forms;
use Filament\Forms\Get;

/**
 * Step-by-step wizard for adding a custom domain.
 *
 * Steps:
 *   1. Enter the domain (validated, not yet persisted).
 *   2. Show DNS records the owner must add (TXT or CNAME — radio toggles).
 *   3. "Verify Now" — runs VerifyDomainAction (handled by the page).
 *   4. SSL provisioning status (auto-poll handled by the page).
 *
 * Step 3 and 4 are largely informational with `Placeholder` content; the
 * actual verification + polling happens in the page lifecycle hooks.
 */
final class WizardSteps
{
    /** @return array<int, Forms\Components\Wizard\Step> */
    public static function steps(): array
    {
        return [
            self::stepEnterDomain(),
            self::stepDnsInstructions(),
            self::stepVerify(),
            self::stepSsl(),
        ];
    }

    private static function stepEnterDomain(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('domain.wizard.step1.title'))
            ->description(__('domain.wizard.step1.description'))
            ->icon('heroicon-o-link')
            ->schema([
                Forms\Components\TextInput::make('domain')
                    ->label(__('domain.col.domain'))
                    ->required()
                    ->placeholder('shop.example.com')
                    ->maxLength(253)
                    ->regex('/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/')
                    ->unique(table: 'tenant_domains', column: 'domain')
                    ->helperText(__('domain.wizard.step1.help'))
                    ->live(onBlur: true),
                Forms\Components\Radio::make('verification_method')
                    ->label(__('domain.wizard.step1.method'))
                    ->options([
                        'txt' => __('domain.method.txt_full'),
                        'cname' => __('domain.method.cname_full'),
                    ])
                    ->descriptions([
                        'txt' => __('domain.method.txt_help'),
                        'cname' => __('domain.method.cname_help'),
                    ])
                    ->default('txt')
                    ->required(),
            ]);
    }

    private static function stepDnsInstructions(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('domain.wizard.step2.title'))
            ->description(__('domain.wizard.step2.description'))
            ->icon('heroicon-o-server-stack')
            ->schema([
                Forms\Components\Placeholder::make('dns_instructions')
                    ->label('')
                    ->content(function (Get $get): \Illuminate\Support\HtmlString {
                        $domain = (string) ($get('domain') ?? 'example.com');
                        $method = (string) ($get('verification_method') ?? 'txt');
                        $token = (string) ($get('verification_token') ?? self::generateTokenPreview());
                        return new \Illuminate\Support\HtmlString(
                            self::renderDnsInstructions($domain, $method, $token),
                        );
                    }),
                Forms\Components\Toggle::make('is_primary')
                    ->label(__('domain.wizard.step2.primary'))
                    ->helperText(__('domain.wizard.step2.primary_help'))
                    ->default(false),
            ]);
    }

    private static function stepVerify(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('domain.wizard.step3.title'))
            ->description(__('domain.wizard.step3.description'))
            ->icon('heroicon-o-check-badge')
            ->schema([
                Forms\Components\Placeholder::make('verify_help')
                    ->label('')
                    ->content(__('domain.wizard.step3.help')),
                Forms\Components\Placeholder::make('verify_status')
                    ->label(__('domain.wizard.step3.status'))
                    ->content(function (Get $get): string {
                        $verified = (bool) ($get('is_verified') ?? false);
                        return $verified
                            ? '✓ ' . __('domain.status.verified')
                            : '… ' . __('domain.status.pending');
                    }),
            ]);
    }

    private static function stepSsl(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('domain.wizard.step4.title'))
            ->description(__('domain.wizard.step4.description'))
            ->icon('heroicon-o-lock-closed')
            ->schema([
                Forms\Components\Placeholder::make('ssl_help')
                    ->label('')
                    ->content(__('domain.wizard.step4.help')),
                Forms\Components\Placeholder::make('ssl_status_display')
                    ->label(__('domain.col.ssl'))
                    ->content(function (Get $get): string {
                        $status = (string) ($get('ssl_status') ?? 'pending');
                        return __("domain.ssl.{$status}");
                    }),
            ]);
    }

    /** Render DNS instructions as HTML for the placeholder block. */
    private static function renderDnsInstructions(string $domain, string $method, string $token): string
    {
        $proxy = (string) config('app.domain_proxy_target', 'proxy.mypos.uz');
        $rows = $method === 'cname'
            ? [
                ['Type' => 'CNAME', 'Host' => $domain, 'Value' => $proxy, 'TTL' => '300'],
            ]
            : [
                ['Type' => 'TXT', 'Host' => "_mypos.{$domain}", 'Value' => $token, 'TTL' => '300'],
                ['Type' => 'CNAME', 'Host' => $domain, 'Value' => $proxy, 'TTL' => '300'],
            ];

        $rendered = '<div class="space-y-3 text-sm">';
        $rendered .= '<p>' . e(__('domain.wizard.step2.intro')) . '</p>';
        $rendered .= '<div class="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">';
        $rendered .= '<table class="w-full text-xs"><thead class="bg-gray-50 dark:bg-gray-800/50">';
        $rendered .= '<tr><th class="text-left p-2">Type</th><th class="text-left p-2">Host</th><th class="text-left p-2">Value</th><th class="text-left p-2">TTL</th></tr>';
        $rendered .= '</thead><tbody class="font-mono">';
        foreach ($rows as $row) {
            $rendered .= '<tr class="border-t border-gray-100 dark:border-gray-700">';
            foreach ($row as $cell) {
                $rendered .= '<td class="p-2">' . e($cell) . '</td>';
            }
            $rendered .= '</tr>';
        }
        $rendered .= '</tbody></table></div>';
        $rendered .= '<p class="text-xs text-gray-500 dark:text-gray-400">' . e(__('domain.wizard.step2.note')) . '</p>';
        $rendered .= '</div>';
        return $rendered;
    }

    private static function generateTokenPreview(): string
    {
        return 'mypos-verify-' . substr(bin2hex(random_bytes(16)), 0, 16);
    }
}
