<?php

declare(strict_types=1);

namespace App\Filament\Pages\AIStudio;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TierFeatures;
use Filament\Forms;

/**
 * Tab schemas for {@see \App\Filament\Pages\AIStudio}.
 *
 * Split out so the Page class stays under the 400-line limit. Each tab returns
 * a `Forms\Components\Tabs\Tab` with cohesive form fields. Tier gating is
 * applied per-tab via `->visible()` so Free tenants see no AI tabs at all,
 * Pro sees the menu generator + translator, Plus adds chatbot config + insights,
 * and Enterprise unlocks the narrative report button on the insights tab.
 *
 * The page itself binds the form state to a single nested array (`$data.menu`,
 * `$data.translate`, etc.) so each tab manages its own state without
 * cross-pollution.
 */
final class AIStudioTabsSchema
{
    /** @return array<int, Forms\Components\Tabs\Tab> */
    public static function tabs(?Tenant $tenant): array
    {
        return [
            self::menuGeneratorTab($tenant),
            self::translatorTab($tenant),
            self::chatbotConfigTab($tenant),
            self::insightsTab($tenant),
        ];
    }

    public static function menuGeneratorTab(?Tenant $tenant): Forms\Components\Tabs\Tab
    {
        return Forms\Components\Tabs\Tab::make(__('ai_studio.tabs.menu_generator'))
            ->icon('heroicon-o-sparkles')
            ->visible(fn (): bool => self::canUseAi($tenant))
            ->schema([
                Forms\Components\Section::make(__('ai_studio.menu.section_title'))
                    ->description(__('ai_studio.menu.section_description'))
                    ->schema([
                        Forms\Components\Select::make('menu.cuisine')
                            ->label(__('ai_studio.menu.cuisine'))
                            ->options(self::cuisineOptions())
                            ->default('lavash')
                            ->required()
                            ->native(false)
                            ->live(),
                        Forms\Components\TextInput::make('menu.item_count')
                            ->label(__('ai_studio.menu.item_count'))
                            ->numeric()
                            ->minValue(10)
                            ->maxValue(50)
                            ->step(5)
                            ->default(20)
                            ->required()
                            ->helperText(__('ai_studio.menu.item_count_help')),
                        Forms\Components\CheckboxList::make('menu.locales')
                            ->label(__('ai_studio.menu.locales'))
                            ->options([
                                'uz' => "O'zbekcha",
                                'ru' => 'Русский',
                                'en' => 'English',
                                'kz' => 'Қазақша',
                            ])
                            ->default(['uz', 'ru'])
                            ->columns(4)
                            ->required(),
                    ])
                    ->columns(2),
                Forms\Components\Section::make(__('ai_studio.menu.results_title'))
                    ->description(__('ai_studio.menu.results_description'))
                    ->visible(fn (Forms\Get $get): bool => is_array($get('menu.results')) && $get('menu.results') !== [])
                    ->schema([
                        Forms\Components\Repeater::make('menu.results')
                            ->label('')
                            ->schema([
                                Forms\Components\TextInput::make('name_uz')
                                    ->label("O'zbekcha")
                                    ->maxLength(120),
                                Forms\Components\TextInput::make('name_ru')
                                    ->label('Русский')
                                    ->maxLength(120),
                                Forms\Components\TextInput::make('name_en')
                                    ->label('English')
                                    ->maxLength(120),
                                Forms\Components\TextInput::make('price')
                                    ->label(__('ai_studio.menu.col_price'))
                                    ->numeric()
                                    ->minValue(0),
                                Forms\Components\TextInput::make('category')
                                    ->label(__('ai_studio.menu.col_category'))
                                    ->maxLength(64),
                                Forms\Components\Textarea::make('description')
                                    ->label(__('ai_studio.menu.col_description'))
                                    ->rows(2)
                                    ->columnSpanFull(),
                            ])
                            ->columns(3)
                            ->itemLabel(fn (array $state): ?string => $state['name_uz'] ?? null)
                            ->collapsible()
                            ->collapsed()
                            ->reorderableWithButtons()
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function translatorTab(?Tenant $tenant): Forms\Components\Tabs\Tab
    {
        return Forms\Components\Tabs\Tab::make(__('ai_studio.tabs.translator'))
            ->icon('heroicon-o-language')
            ->visible(fn (): bool => self::canUseAi($tenant))
            ->schema([
                Forms\Components\Section::make(__('ai_studio.translate.section_title'))
                    ->description(__('ai_studio.translate.section_description'))
                    ->schema([
                        Forms\Components\Textarea::make('translate.source_text')
                            ->label(__('ai_studio.translate.source_text'))
                            ->rows(4)
                            ->required()
                            ->columnSpanFull(),
                        Forms\Components\Select::make('translate.source_locale')
                            ->label(__('ai_studio.translate.source_locale'))
                            ->options(self::localeOptions())
                            ->default('uz')
                            ->required()
                            ->native(false),
                        Forms\Components\CheckboxList::make('translate.target_locales')
                            ->label(__('ai_studio.translate.target_locales'))
                            ->options(self::localeOptions())
                            ->default(['ru', 'en'])
                            ->required()
                            ->columns(3),
                    ])
                    ->columns(2),
                Forms\Components\Section::make(__('ai_studio.translate.apply_title'))
                    ->description(__('ai_studio.translate.apply_description'))
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        // Tenant-scoped MenuItem picker. We resolve options
                        // lazily so super admins viewing the page without a
                        // tenant context don't trigger an empty IN () query.
                        Forms\Components\Select::make('translate.menu_item_id')
                            ->label(__('ai_studio.translate.menu_item'))
                            ->options(static fn (): array => self::menuItemOptions($tenant))
                            ->searchable()
                            ->placeholder(__('ai_studio.translate.menu_item_placeholder')),
                    ]),
            ]);
    }

    public static function chatbotConfigTab(?Tenant $tenant): Forms\Components\Tabs\Tab
    {
        $tier = TierFeatures::for($tenant?->getAttribute('tier'));

        return Forms\Components\Tabs\Tab::make(__('ai_studio.tabs.chatbot'))
            ->icon('heroicon-o-chat-bubble-left-right')
            ->visible(fn (): bool => self::canUseAi($tenant))
            ->schema([
                Forms\Components\Section::make(__('ai_studio.chatbot.welcome_title'))
                    ->description(__('ai_studio.chatbot.welcome_description'))
                    ->schema([
                        Forms\Components\TextInput::make('chatbot.welcome.uz')
                            ->label("O'zbekcha")
                            ->maxLength(255),
                        Forms\Components\TextInput::make('chatbot.welcome.ru')
                            ->label('Русский')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('chatbot.welcome.en')
                            ->label('English')
                            ->maxLength(255),
                    ])
                    ->columns(3),
                Forms\Components\Section::make(__('ai_studio.chatbot.personality_title'))
                    ->description(__('ai_studio.chatbot.personality_description'))
                    ->schema([
                        Forms\Components\Textarea::make('chatbot.personality')
                            ->label(__('ai_studio.chatbot.personality'))
                            ->rows(4)
                            ->maxLength(1000)
                            ->columnSpanFull(),
                        Forms\Components\Textarea::make('chatbot.refusal_message')
                            ->label(__('ai_studio.chatbot.refusal_message'))
                            ->rows(2)
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ]),
                Forms\Components\Section::make(__('ai_studio.chatbot.channels_title'))
                    ->description(__('ai_studio.chatbot.channels_description'))
                    ->schema([
                        Forms\Components\Toggle::make('chatbot.channels.web')
                            ->label(__('ai_studio.chatbot.channel_web'))
                            ->default(true)
                            ->disabled()
                            ->helperText(__('ai_studio.chatbot.channel_web_help')),
                        Forms\Components\Toggle::make('chatbot.channels.telegram')
                            ->label(__('ai_studio.chatbot.channel_telegram'))
                            ->disabled(! $tier->canUseCustomDomain())
                            ->helperText($tier->canUseCustomDomain()
                                ? __('ai_studio.chatbot.channel_telegram_help')
                                : __('ai_studio.chatbot.channel_upgrade')),
                        Forms\Components\Toggle::make('chatbot.channels.whatsapp')
                            ->label(__('ai_studio.chatbot.channel_whatsapp'))
                            ->disabled(! $tier->canUseNativeApp())
                            ->helperText($tier->canUseNativeApp()
                                ? __('ai_studio.chatbot.channel_whatsapp_help')
                                : __('ai_studio.chatbot.channel_upgrade')),
                    ])
                    ->columns(3),
            ]);
    }

    public static function insightsTab(?Tenant $tenant): Forms\Components\Tabs\Tab
    {
        $tier = TierFeatures::for($tenant?->getAttribute('tier'));

        return Forms\Components\Tabs\Tab::make(__('ai_studio.tabs.insights'))
            ->icon('heroicon-o-chart-bar')
            // Plus+ tier gate. Insights tab is hidden for Free + Pro.
            ->visible(fn (): bool => self::canUseInsights($tenant))
            ->schema([
                Forms\Components\Placeholder::make('insights.summary')
                    ->label('')
                    ->content(__('ai_studio.insights.summary_help'))
                    ->columnSpanFull(),
                // Heavy data rendering happens in the Blade view via
                // {@see \App\Filament\Pages\AIStudio::getInsightsState()};
                // this placeholder is just the form-side anchor so the tab
                // still has structure.
                Forms\Components\Placeholder::make('insights.report_help')
                    ->label('')
                    ->content($tier->tier->atLeast(\App\Domain\Tenant\Enums\TenantTier::Enterprise)
                        ? __('ai_studio.insights.enterprise_help')
                        : __('ai_studio.insights.upgrade_help'))
                    ->columnSpanFull(),
            ]);
    }

    /**
     * The page itself is gated to Pro+ — Free sees no AI Studio. Returning
     * `false` here also collapses the relevant tabs so navigating to the page
     * directly is harmless.
     */
    public static function canUseAi(?Tenant $tenant): bool
    {
        if ($tenant === null) {
            return true; // super admin demo mode
        }
        $tier = TierFeatures::for($tenant->getAttribute('tier'));
        // Pro+ for menu_generator + translator + basic chatbot.
        return $tier->canUseAdvancedBranding() || $tier->canUseCustomCss();
    }

    public static function canUseInsights(?Tenant $tenant): bool
    {
        if ($tenant === null) {
            return true;
        }
        $tier = TierFeatures::for($tenant->getAttribute('tier'));
        return $tier->canUseCustomCss(); // Plus+
    }

    /** @return array<string, string> */
    public static function cuisineOptions(): array
    {
        return [
            'pizza' => __('ai_studio.cuisine.pizza'),
            'lavash' => __('ai_studio.cuisine.lavash'),
            'choyxona' => __('ai_studio.cuisine.choyxona'),
            'fastfood' => __('ai_studio.cuisine.fastfood'),
            'sushi' => __('ai_studio.cuisine.sushi'),
            'dessert' => __('ai_studio.cuisine.dessert'),
            'european' => __('ai_studio.cuisine.european'),
            'asian' => __('ai_studio.cuisine.asian'),
            'custom' => __('ai_studio.cuisine.custom'),
        ];
    }

    /** @return array<string, string> */
    public static function localeOptions(): array
    {
        return [
            'uz' => "O'zbekcha",
            'ru' => 'Русский',
            'en' => 'English',
            'kz' => 'Қазақша',
            'ky' => 'Кыргызча',
            'tg' => 'Тоҷикӣ',
        ];
    }

    /**
     * Pick a sensible label from a (potentially) multi-locale `name` JSON
     * column. Mirrors the same fallback chain used by the Country / Currency
     * helpers — locale → en → uz → first.
     */
    private static function pickItemName(mixed $record): string
    {
        if (! is_object($record)) {
            return '—';
        }
        $name = $record->name ?? null;
        if (is_array($name)) {
            return (string) (
                $name[app()->getLocale()]
                ?? $name['en']
                ?? $name['uz']
                ?? reset($name)
                ?: '—'
            );
        }
        return is_string($name) ? $name : (string) ($record->id ?? '—');
    }

    /**
     * Build the [id => label] options array for the translator tab's
     * "apply to existing item" picker. Returns an empty array when the
     * MenuItem model doesn't exist yet (fresh install / CI), so the dropdown
     * is harmlessly empty.
     *
     * @return array<string, string>
     */
    private static function menuItemOptions(?Tenant $tenant): array
    {
        if ($tenant === null) {
            return [];
        }
        $modelClass = '\\App\\Domain\\Menu\\Models\\MenuItem';
        if (! class_exists($modelClass)) {
            return [];
        }
        try {
            $records = $modelClass::query()
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
                ->limit(200)
                ->get(['id', 'name']);
        } catch (\Throwable) {
            return [];
        }

        $out = [];
        foreach ($records as $record) {
            $out[(string) $record->id] = self::pickItemName($record);
        }
        return $out;
    }
}
