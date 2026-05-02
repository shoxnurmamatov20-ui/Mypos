<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppResource\Schemas;

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Models\TenantApp;
use Filament\Forms;
use Filament\Forms\Get;

/**
 * Form schema for {@see \App\Filament\Resources\TenantAppResource}.
 *
 * Split into focused sections so the file stays under the 400-line cap and
 * each platform-specific section can be hidden via `->visible()` based on
 * the chosen platform without leaking those fields into other rows.
 *
 * Reactive helpers (`$get('platform')`) drive section visibility — Apple-only
 * fields disappear when platform=android and vice versa. The bundle_id field
 * also forwards into google_package_name as the suggested default.
 */
final class TenantAppFormSchema
{
    /** @return array<int, Forms\Components\Component> */
    public static function sections(): array
    {
        return [
            self::identitySection(),
            self::visualAssetsSection(),
            self::appleSection(),
            self::googleSection(),
            self::buildAccountSection(),
        ];
    }

    private static function identitySection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('app.section.identity'))
            ->columns(2)
            ->schema([
                Forms\Components\Select::make('platform')
                    ->label(__('app.col.platform'))
                    ->options(self::platformOptions())
                    ->required()
                    ->live()
                    ->native(false)
                    ->disabled(fn (?TenantApp $record): bool => $record !== null)
                    ->dehydrated(),
                Forms\Components\TextInput::make('app_name')
                    ->label(__('app.col.app_name'))
                    ->required()
                    ->maxLength(64)
                    ->helperText(__('app.help.app_name')),
                Forms\Components\TextInput::make('short_name')
                    ->label(__('app.col.short_name'))
                    ->maxLength(32)
                    ->helperText(__('app.help.short_name')),
                Forms\Components\TextInput::make('bundle_id')
                    ->label(__('app.col.bundle_id'))
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->regex('/^[a-z]{2,}\.[a-z0-9-]+(\.[a-z0-9-]+)*$/i')
                    ->helperText(__('app.help.bundle_id'))
                    // status is cast to AppStatus enum — compare via enum cases,
                    // not strings (in_array(EnumCase, ['live','review'], true) === false).
                    ->disabled(fn (?TenantApp $record): bool => $record !== null
                        && in_array($record->status, [
                            \App\Domain\Tenant\Enums\AppStatus::Live,
                            \App\Domain\Tenant\Enums\AppStatus::Review,
                        ], true)),
                Forms\Components\KeyValue::make('description')
                    ->label(__('app.col.description'))
                    ->keyLabel(__('app.col.description'))
                    ->valueLabel('')
                    ->keyPlaceholder('uz / ru / en')
                    ->columnSpanFull()
                    ->reorderable(false)
                    ->default(['uz' => '', 'ru' => '', 'en' => '']),
                Forms\Components\TagsInput::make('keywords')
                    ->label(__('app.col.keywords'))
                    ->columnSpanFull()
                    ->placeholder('food, delivery, restaurant'),
            ]);
    }

    private static function visualAssetsSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('app.section.visual'))
            ->columns(2)
            ->schema([
                Forms\Components\FileUpload::make('icon_url')
                    ->label(__('app.col.icon'))
                    ->disk('minio')
                    ->directory('tenant-apps/icons')
                    ->image()
                    ->imagePreviewHeight('120')
                    ->required()
                    ->helperText(__('app.help.icon')),
                Forms\Components\FileUpload::make('splash_url')
                    ->label(__('app.col.splash'))
                    ->disk('minio')
                    ->directory('tenant-apps/splash')
                    ->image()
                    ->imagePreviewHeight('120')
                    ->helperText(__('app.help.splash')),
                Forms\Components\FileUpload::make('adaptive_icon_url')
                    ->label(__('app.col.adaptive_icon'))
                    ->disk('minio')
                    ->directory('tenant-apps/adaptive')
                    ->image()
                    ->imagePreviewHeight('120')
                    ->visible(fn (Get $get): bool => self::androidPlatform($get))
                    ->helperText(__('app.help.adaptive_icon')),
                Forms\Components\ColorPicker::make('adaptive_icon_bg')
                    ->label(__('app.col.adaptive_icon_bg'))
                    ->visible(fn (Get $get): bool => self::androidPlatform($get))
                    ->helperText(__('app.help.adaptive_icon_bg'))
                    ->default('#ffffff'),
                Forms\Components\FileUpload::make('feature_graphic_url')
                    ->label(__('app.col.feature_graphic'))
                    ->disk('minio')
                    ->directory('tenant-apps/feature')
                    ->image()
                    ->imagePreviewHeight('120')
                    ->visible(fn (Get $get): bool => self::androidPlatform($get))
                    ->helperText(__('app.help.feature_graphic')),
                Forms\Components\Repeater::make('screenshots')
                    ->label(__('app.col.screenshots'))
                    ->columnSpanFull()
                    ->minItems(0)
                    ->maxItems(8)
                    ->reorderable()
                    ->collapsible()
                    ->schema([
                        Forms\Components\Select::make('device')
                            ->label('Device')
                            ->options([
                                'iphone_6_7' => 'iPhone 6.7"',
                                'iphone_6_5' => 'iPhone 6.5"',
                                'iphone_5_5' => 'iPhone 5.5"',
                                'android_phone' => 'Android phone',
                                'android_tablet_7' => 'Android 7" tablet',
                                'android_tablet_10' => 'Android 10" tablet',
                            ])
                            ->required(),
                        Forms\Components\FileUpload::make('urls')
                            ->label('Files')
                            ->disk('minio')
                            ->directory('tenant-apps/screenshots')
                            ->image()
                            ->multiple()
                            ->reorderable()
                            ->minFiles(1)
                            ->maxFiles(8),
                    ])
                    ->helperText(__('app.help.screenshots')),
            ]);
    }

    private static function appleSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('app.section.apple'))
            ->columns(3)
            ->visible(fn (Get $get): bool => self::iosPlatform($get))
            ->schema([
                Forms\Components\TextInput::make('apple_team_id')
                    ->label(__('app.col.apple_team_id'))
                    ->maxLength(16)
                    ->regex('/^[A-Z0-9]{10}$/')
                    ->helperText(__('app.help.apple_team_id')),
                Forms\Components\TextInput::make('apple_app_id')
                    ->label(__('app.col.apple_app_id'))
                    ->numeric()
                    ->minValue(1)
                    ->helperText(__('app.help.apple_app_id')),
                Forms\Components\TextInput::make('apple_sku')
                    ->label(__('app.col.apple_sku'))
                    ->maxLength(64),
            ]);
    }

    private static function googleSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('app.section.google'))
            ->columns(2)
            ->visible(fn (Get $get): bool => self::androidPlatform($get))
            ->schema([
                Forms\Components\TextInput::make('google_package_name')
                    ->label(__('app.col.google_package_name'))
                    ->maxLength(255)
                    ->helperText(__('app.help.google_package_name'))
                    ->default(fn (Get $get): ?string => $get('bundle_id'))
                    ->placeholder(fn (Get $get): ?string => $get('bundle_id')),
                Forms\Components\TextInput::make('google_app_id')
                    ->label(__('app.col.google_app_id'))
                    ->maxLength(64),
            ]);
    }

    private static function buildAccountSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('app.section.build_account'))
            ->columns(1)
            ->schema([
                Forms\Components\Radio::make('build_account')
                    ->label(__('app.col.build_account'))
                    ->options([
                        'mypos' => __('app.build_account_option.mypos'),
                        'tenant' => __('app.build_account_option.tenant'),
                    ])
                    ->descriptions([
                        'mypos' => __('app.help.build_account_mypos'),
                        'tenant' => __('app.help.build_account_tenant'),
                    ])
                    ->default('mypos')
                    ->live(),
                Forms\Components\Placeholder::make('byo_account_help')
                    ->label('')
                    ->visible(fn (Get $get): bool => $get('build_account') === 'tenant')
                    ->content(__('app.help.build_account_tenant')),
            ]);
    }

    /** @return array<string, string> */
    public static function platformOptions(): array
    {
        $options = [];
        foreach (AppPlatform::cases() as $case) {
            $options[$case->value] = __("app.platform.{$case->value}");
        }
        return $options;
    }

    private static function iosPlatform(Get $get): bool
    {
        $value = (string) ($get('platform') ?? '');
        return $value === AppPlatform::Ios->value || $value === AppPlatform::Universal->value;
    }

    private static function androidPlatform(Get $get): bool
    {
        $value = (string) ($get('platform') ?? '');
        return $value === AppPlatform::Android->value || $value === AppPlatform::Universal->value;
    }

    public static function statusColor(string $status): string
    {
        return match ($status) {
            'live' => 'success',
            'review', 'building' => 'info',
            'configuring', 'draft' => 'warning',
            'rejected' => 'danger',
            'paused' => 'gray',
            default => 'gray',
        };
    }
}
