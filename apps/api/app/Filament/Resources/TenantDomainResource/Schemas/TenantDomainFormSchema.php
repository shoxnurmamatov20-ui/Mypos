<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantDomainResource\Schemas;

use App\Domain\Tenant\Models\TenantDomain;
use Filament\Forms;

/**
 * Form schema for the TenantDomain edit page.
 *
 * The Wizard for the create page lives in {@see WizardSchema} — this
 * schema is for the simpler edit/view paths only.
 */
final class TenantDomainFormSchema
{
    /** @return array<int, Forms\Components\Component> */
    public static function sections(): array
    {
        return [
            Forms\Components\Section::make(__('domain.form.basic'))
                ->schema([
                    Forms\Components\TextInput::make('domain')
                        ->label(__('domain.col.domain'))
                        ->required()
                        ->disabled(fn (?TenantDomain $record): bool => $record !== null)
                        ->dehydrated()
                        ->maxLength(253)
                        ->regex('/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/')
                        ->helperText(__('domain.form.domain_help')),
                    Forms\Components\Toggle::make('is_primary')
                        ->label(__('domain.col.primary'))
                        ->helperText(__('domain.form.primary_help')),
                ])
                ->columns(2),

            Forms\Components\Section::make(__('domain.form.verification'))
                ->schema([
                    Forms\Components\Select::make('verification_method')
                        ->label(__('domain.col.method'))
                        ->options([
                            'txt' => __('domain.method.txt'),
                            'cname' => __('domain.method.cname'),
                        ])
                        ->default('txt')
                        ->required()
                        ->native(false),
                    Forms\Components\TextInput::make('verification_token')
                        ->label(__('domain.form.token'))
                        ->disabled()
                        ->dehydrated()
                        ->helperText(__('domain.form.token_help')),
                ])
                ->columns(2),

            Forms\Components\Section::make(__('domain.form.routing'))
                ->collapsed()
                ->schema([
                    Forms\Components\TextInput::make('redirects_to')
                        ->label(__('domain.form.redirects_to'))
                        ->placeholder('example.com')
                        ->maxLength(253)
                        ->helperText(__('domain.form.redirects_help')),
                ]),
        ];
    }
}
