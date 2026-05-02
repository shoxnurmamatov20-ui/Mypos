<?php

declare(strict_types=1);

namespace App\Filament\Pages\AppBuilder;

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Models\Tenant;
use Filament\Forms;
use Filament\Forms\Get;
use Filament\Forms\Set;
use Illuminate\Support\Str;

/**
 * Wizard step definitions for {@see \App\Filament\Pages\AppBuilder}.
 *
 * Split out so the Page class stays under the 400-line limit and the steps
 * can be unit-tested in isolation. All four steps are cohesive rather than
 * "form fields scattered across files" — each helper returns a single
 * `Wizard\Step` keyed off the same data object.
 *
 * Suggested defaults (auto-fill flow):
 *   - Step 2 reads the tenant's `name` / `slug` to pre-populate `app_name`
 *     and `bundle_id` so first-time setup is one-click for most tenants.
 *   - Step 3 marks "auto-generate" placeholders for splash/adaptive icon —
 *     {@see \App\Domain\Tenant\Services\AppAssetService} performs the actual
 *     resizing once the row exists; the wizard merely records the *intent*.
 *
 * The data shape this wizard produces matches {@see \App\Domain\Tenant\Models\TenantApp}
 * exactly — see {@see \App\Filament\Pages\AppBuilder::createApps()} for how
 * the wizard's flat array is split into one row per platform when the user
 * selects "Both".
 */
final class AppBuilderWizardSchema
{
    /** @return array<int, Forms\Components\Wizard\Step> */
    public static function steps(?Tenant $tenant): array
    {
        return [
            self::platformStep(),
            self::identityStep($tenant),
            self::visualStep(),
            self::buildAccountStep(),
        ];
    }

    private static function platformStep(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('app.wizard.step1.title'))
            ->description(__('app.wizard.step1.description'))
            ->icon('heroicon-o-device-phone-mobile')
            ->schema([
                Forms\Components\Radio::make('platform')
                    ->label(__('app.wizard.step1.title'))
                    ->required()
                    ->live()
                    ->options([
                        AppPlatform::Universal->value => __('app.wizard.step1.option_universal'),
                        AppPlatform::Ios->value => __('app.wizard.step1.option_ios'),
                        AppPlatform::Android->value => __('app.wizard.step1.option_android'),
                    ])
                    ->descriptions([
                        AppPlatform::Universal->value => __('app.wizard.step1.option_universal_help'),
                        AppPlatform::Ios->value => __('app.wizard.step1.option_ios_help'),
                        AppPlatform::Android->value => __('app.wizard.step1.option_android_help'),
                    ])
                    ->default(AppPlatform::Universal->value),
            ]);
    }

    private static function identityStep(?Tenant $tenant): Forms\Components\Wizard\Step
    {
        $defaultName = $tenant?->name ?? '';
        $defaultBundle = self::suggestBundleId($tenant);

        return Forms\Components\Wizard\Step::make(__('app.wizard.step2.title'))
            ->description(__('app.wizard.step2.description'))
            ->icon('heroicon-o-identification')
            ->columns(2)
            ->schema([
                Forms\Components\TextInput::make('app_name')
                    ->label(__('app.col.app_name'))
                    ->required()
                    ->maxLength(64)
                    ->default($defaultName)
                    ->live(onBlur: true)
                    ->afterStateUpdated(static function (Set $set, Get $get, ?string $state): void {
                        // Only auto-fill bundle_id if it's empty / still the default
                        // pattern — preserves whatever the user typed manually.
                        $current = (string) ($get('bundle_id') ?? '');
                        if ($current === '' || str_starts_with($current, 'com.mypos.')) {
                            $set('bundle_id', self::slugifyToBundle($state ?? ''));
                        }
                    })
                    ->helperText(__('app.wizard.step2.app_name_help')),
                Forms\Components\TextInput::make('short_name')
                    ->label(__('app.col.short_name'))
                    ->maxLength(32),
                Forms\Components\TextInput::make('bundle_id')
                    ->label(__('app.col.bundle_id'))
                    ->required()
                    ->maxLength(255)
                    ->default($defaultBundle)
                    ->regex('/^[a-z]{2,}\.[a-z0-9-]+(\.[a-z0-9-]+)*$/i')
                    ->helperText(__('app.wizard.step2.bundle_id_help'))
                    ->columnSpanFull(),
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

    private static function visualStep(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('app.wizard.step3.title'))
            ->description(__('app.wizard.step3.description'))
            ->icon('heroicon-o-photo')
            ->columns(2)
            ->schema([
                Forms\Components\FileUpload::make('icon_url')
                    ->label(__('app.col.icon'))
                    ->disk('minio')
                    ->directory('tenant-apps/icons')
                    ->image()
                    ->imagePreviewHeight('120')
                    ->required()
                    ->columnSpanFull()
                    ->helperText(__('app.wizard.step3.icon_help')),
                Forms\Components\Toggle::make('auto_generate_splash')
                    ->label(__('app.wizard.step3.splash_auto'))
                    ->default(true)
                    ->dehydrated(false),
                Forms\Components\Toggle::make('auto_generate_adaptive')
                    ->label(__('app.wizard.step3.adaptive_auto'))
                    ->default(true)
                    ->dehydrated(false)
                    ->visible(fn (Get $get): bool => self::needsAndroid($get)),
                Forms\Components\ColorPicker::make('adaptive_icon_bg')
                    ->label(__('app.col.adaptive_icon_bg'))
                    ->default('#ffffff')
                    ->visible(fn (Get $get): bool => self::needsAndroid($get)),
            ]);
    }

    private static function buildAccountStep(): Forms\Components\Wizard\Step
    {
        return Forms\Components\Wizard\Step::make(__('app.wizard.step4.title'))
            ->description(__('app.wizard.step4.description'))
            ->icon('heroicon-o-key')
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
                    ->required()
                    ->live(),
                Forms\Components\Placeholder::make('byo_account_help')
                    ->label('')
                    ->visible(fn (Get $get): bool => $get('build_account') === 'tenant')
                    ->content(__('app.help.build_account_tenant')),
            ]);
    }

    /**
     * Suggest a sensible default bundle id from the tenant's slug — falls back
     * to a `com.mypos.<random>` placeholder when the slug is missing or invalid.
     */
    public static function suggestBundleId(?Tenant $tenant): string
    {
        $slug = $tenant?->slug ?? '';
        $clean = self::slugifyToBundle($slug !== '' ? $slug : 'app');
        if ($clean === '' || ! str_contains($clean, '.')) {
            return 'com.mypos.' . ($slug !== '' ? Str::slug($slug, '') : 'app');
        }
        return $clean;
    }

    /** Convert a free-form name into a reverse-domain bundle id. */
    private static function slugifyToBundle(string $name): string
    {
        $slug = Str::slug($name, '-');
        if ($slug === '') {
            return '';
        }
        return 'com.mypos.' . str_replace('-', '', $slug);
    }

    /**
     * `platform` is collected in step 1; android-only fields appear when the
     * tenant chose Android-only or Universal.
     */
    private static function needsAndroid(Get $get): bool
    {
        $value = (string) ($get('platform') ?? AppPlatform::Universal->value);
        return $value === AppPlatform::Android->value || $value === AppPlatform::Universal->value;
    }
}
