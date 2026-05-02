<?php

declare(strict_types=1);

namespace App\Filament\Pages\BrandStudio;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TierFeatures;
use Filament\Forms;

/**
 * Form sections for the Brand Studio page.
 *
 * Split out so the Page class stays under the 400-line limit.
 * Sections are composed in `BrandStudio::getForms()`.
 */
final class BrandFormSchema
{
    /** Storage disk for uploaded brand assets. */
    public const string ASSET_DISK = 'public';

    /** @return array<int, Forms\Components\Component> */
    public static function sections(?Tenant $tenant): array
    {
        return [
            self::themeSection(),
            self::logoSection(),
            self::colorSection(),
            self::typographySection(),
            self::heroCopySection(),
            self::customCssSection($tenant),
            self::socialSection(),
        ];
    }

    public static function themeSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('brand.theme.title'))
            ->description(__('brand.theme.description'))
            ->schema([
                Forms\Components\Select::make('theme')
                    ->label(__('brand.theme.label'))
                    ->options([
                        'modern' => __('brand.theme.modern'),
                        'classic' => __('brand.theme.classic'),
                        'minimal' => __('brand.theme.minimal'),
                        'premium' => __('brand.theme.premium'),
                    ])
                    ->default('modern')
                    ->required()
                    ->native(false)
                    ->live(),
            ]);
    }

    public static function logoSection(): Forms\Components\Section
    {
        $disk = self::ASSET_DISK;
        return Forms\Components\Section::make(__('brand.logos.title'))
            ->description(__('brand.logos.description'))
            ->schema([
                Forms\Components\FileUpload::make('logo_url')
                    ->label(__('brand.logos.logo'))
                    ->image()
                    ->disk($disk)
                    ->directory('brand-assets/logos')
                    ->visibility('public')
                    ->maxSize(5120)
                    ->imagePreviewHeight('80')
                    ->live(),
                Forms\Components\FileUpload::make('logo_dark_url')
                    ->label(__('brand.logos.logo_dark'))
                    ->helperText(__('brand.logos.logo_dark_help'))
                    ->image()
                    ->disk($disk)
                    ->directory('brand-assets/logos')
                    ->visibility('public')
                    ->maxSize(5120)
                    ->imagePreviewHeight('80'),
                Forms\Components\FileUpload::make('favicon_url')
                    ->label(__('brand.logos.favicon'))
                    ->helperText(__('brand.logos.favicon_help'))
                    ->image()
                    ->disk($disk)
                    ->directory('brand-assets/favicons')
                    ->visibility('public')
                    ->maxSize(512)
                    ->imagePreviewHeight('48'),
                Forms\Components\FileUpload::make('cover_image_url')
                    ->label(__('brand.logos.cover'))
                    ->image()
                    ->disk($disk)
                    ->directory('brand-assets/covers')
                    ->visibility('public')
                    ->maxSize(8192)
                    ->imagePreviewHeight('120'),
                Forms\Components\FileUpload::make('hero_image_url')
                    ->label(__('brand.logos.hero'))
                    ->image()
                    ->disk($disk)
                    ->directory('brand-assets/hero')
                    ->visibility('public')
                    ->maxSize(8192)
                    ->imagePreviewHeight('120')
                    ->live(),
                Forms\Components\FileUpload::make('ogimage_url')
                    ->label(__('brand.logos.og'))
                    ->helperText(__('brand.logos.og_help'))
                    ->image()
                    ->disk($disk)
                    ->directory('brand-assets/og')
                    ->visibility('public')
                    ->maxSize(8192)
                    ->imagePreviewHeight('80'),
            ])
            ->columns(2);
    }

    public static function colorSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('brand.colors.title'))
            ->description(__('brand.colors.description'))
            ->schema([
                Forms\Components\ColorPicker::make('primary_color')
                    ->label(__('brand.colors.primary'))
                    ->default('#EA7C69')
                    ->required()
                    ->live(),
                Forms\Components\ColorPicker::make('accent_color')
                    ->label(__('brand.colors.accent'))
                    ->default('#9333EA')
                    ->required()
                    ->live(),
                Forms\Components\ColorPicker::make('text_color')
                    ->label(__('brand.colors.text'))
                    ->default('#0F172A')
                    ->required()
                    ->live(),
                Forms\Components\ColorPicker::make('background_color')
                    ->label(__('brand.colors.background'))
                    ->default('#FFFFFF')
                    ->required()
                    ->live(),
            ])
            ->columns(2);
    }

    public static function typographySection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('brand.typography.title'))
            ->schema([
                Forms\Components\Select::make('font_family')
                    ->label(__('brand.typography.font_family'))
                    ->options(self::fontOptions())
                    ->default('Inter')
                    ->required()
                    ->searchable()
                    ->native(false)
                    ->live(),
                Forms\Components\Select::make('font_heading')
                    ->label(__('brand.typography.font_heading'))
                    ->helperText(__('brand.typography.font_heading_help'))
                    ->options(self::fontOptions())
                    ->searchable()
                    ->native(false)
                    ->live(),
            ])
            ->columns(2);
    }

    public static function heroCopySection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('brand.hero.title'))
            ->description(__('brand.hero.description'))
            ->schema([
                Forms\Components\Tabs::make('hero_tabs')
                    ->columnSpanFull()
                    ->tabs([
                        Forms\Components\Tabs\Tab::make("O'zbekcha")
                            ->schema(self::heroFieldsForLocale('uz')),
                        Forms\Components\Tabs\Tab::make('Русский')
                            ->schema(self::heroFieldsForLocale('ru')),
                        Forms\Components\Tabs\Tab::make('English')
                            ->schema(self::heroFieldsForLocale('en')),
                    ]),
            ]);
    }

    public static function customCssSection(?Tenant $tenant): Forms\Components\Section
    {
        $hasAccess = $tenant !== null && self::canUseCustomCss($tenant);
        return Forms\Components\Section::make(__('brand.custom_css.title'))
            ->description(
                $hasAccess
                    ? __('brand.custom_css.description')
                    : __('brand.custom_css.upgrade_required'),
            )
            ->collapsed()
            ->visible($hasAccess)
            ->schema([
                Forms\Components\Textarea::make('custom_css')
                    ->label(__('brand.custom_css.label'))
                    ->helperText(__('brand.custom_css.helper'))
                    ->rows(12)
                    ->autosize()
                    ->extraInputAttributes(['class' => 'font-mono text-xs'])
                    ->columnSpanFull(),
            ]);
    }

    public static function socialSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make(__('brand.social.title'))
            ->collapsed()
            ->schema([
                Forms\Components\TextInput::make('instagram_handle')
                    ->label('Instagram')
                    ->prefix('@')
                    ->maxLength(64),
                Forms\Components\TextInput::make('telegram_handle')
                    ->label('Telegram')
                    ->prefix('@')
                    ->maxLength(64),
                Forms\Components\TextInput::make('facebook_url')
                    ->label('Facebook URL')
                    ->url()
                    ->maxLength(255),
            ])
            ->columns(2);
    }

    /** @return array<int, Forms\Components\Component> */
    private static function heroFieldsForLocale(string $locale): array
    {
        return [
            Forms\Components\TextInput::make("hero_title.{$locale}")
                ->label(__('brand.hero.heading'))
                ->maxLength(120)
                ->live(debounce: 400),
            Forms\Components\TextInput::make("hero_subtitle.{$locale}")
                ->label(__('brand.hero.subheading'))
                ->maxLength(160)
                ->live(debounce: 400),
            Forms\Components\TextInput::make("tagline.{$locale}")
                ->label(__('brand.hero.tagline'))
                ->maxLength(80)
                ->live(debounce: 400),
        ];
    }

    /** @return array<string, string> */
    private static function fontOptions(): array
    {
        return [
            'Inter' => 'Inter',
            'Poppins' => 'Poppins',
            'Roboto' => 'Roboto',
            'Manrope' => 'Manrope',
            'Montserrat' => 'Montserrat',
            'Nunito' => 'Nunito',
            'Open Sans' => 'Open Sans',
            'Playfair Display' => 'Playfair Display (serif)',
            'Merriweather' => 'Merriweather (serif)',
            'JetBrains Mono' => 'JetBrains Mono',
        ];
    }

    private static function canUseCustomCss(Tenant $tenant): bool
    {
        $tier = $tenant->getAttribute('tier');
        return TierFeatures::for($tier)->canUseCustomCss();
    }
}
