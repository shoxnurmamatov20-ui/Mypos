<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domain\Tenant\Models\Tenant;
use App\Filament\Pages\AIStudio\AIStudioTabsSchema;
use App\Filament\Pages\AIStudio\HandlesAIStudioActions;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Components\Tabs;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Pages\Page;

/**
 * AI Studio — single page with four tabs covering every AI-powered feature.
 *
 * Tabs (rendered + tier-gated by {@see AIStudioTabsSchema}):
 *   1. Menu Generator      — calls GenerateMenuAction (Pro+)
 *   2. Translator          — calls AutoTranslateAction (Pro+)
 *   3. Chatbot Config      — welcome + personality + channels + live test panel
 *   4. Insights            — DemandForecastService + Enterprise-gated AI report
 *
 * Tier gating:
 *   - Whole page hidden for Free tenants (no AI access at all).
 *   - Insights tab hidden until Plus+; Enterprise unlocks the narrative button.
 *   - Super admins always see everything for support purposes.
 *
 * Action handlers live in the {@see HandlesAIStudioActions} trait — extracted
 * so the page class stays under the 400-line limit.
 *
 * Backend dependencies (Agents E2 / E3):
 *   - {@see \App\Domain\AI\Services\AnthropicClient} (E2)
 *   - GenerateMenuAction / AutoTranslateAction / AnalyzeRestaurantInsightsAction
 *     (E2/E3 — invoked dynamically so the page compiles before they ship)
 *   - {@see \App\Domain\AI\Services\DemandForecastService} (E3)
 *   - {@see \App\Domain\AI\Services\ChatbotService} (E3)
 *
 * @property-read Form $form
 */
class AIStudio extends Page implements HasForms
{
    use InteractsWithForms;
    use HandlesAIStudioActions;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationGroup = 'AI';

    protected static ?int $navigationSort = 1;

    protected static string $view = 'filament.pages.ai-studio';

    protected static ?string $slug = 'ai-studio';

    /** @var array<string, mixed> */
    public array $data = [];

    /**
     * Live chat-test transcript (Tab 3). Each entry is `{role, content}`.
     *
     * @var array<int, array{role: string, content: string}>
     */
    public array $testChat = [];

    /** Test-chat input — bound to a Livewire field via the Blade view. */
    public string $testChatInput = '';

    public static function getNavigationLabel(): string
    {
        return __('ai_studio.nav.label');
    }

    public function getTitle(): string
    {
        return __('ai_studio.page.title');
    }

    public static function shouldRegisterNavigation(): bool
    {
        return self::canAccess();
    }

    public static function canAccess(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return true;
        }
        return AIStudioTabsSchema::canUseAi($user->tenant);
    }

    public function mount(): void
    {
        $this->form->fill([
            'menu' => [
                'cuisine' => 'lavash',
                'item_count' => 20,
                'locales' => ['uz', 'ru'],
                'results' => [],
            ],
            'translate' => [
                'source_locale' => 'uz',
                'target_locales' => ['ru', 'en'],
                'source_text' => '',
                'translations' => [],
            ],
            'chatbot' => [
                'welcome' => ['uz' => '', 'ru' => '', 'en' => ''],
                'personality' => '',
                'refusal_message' => '',
                'channels' => [
                    'web' => true,
                    'telegram' => false,
                    'whatsapp' => false,
                ],
            ],
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Tabs::make('ai_studio_tabs')
                    ->tabs(AIStudioTabsSchema::tabs($this->resolveTenant()))
                    ->columnSpanFull()
                    ->persistTabInQueryString('ai-tab'),
            ])
            ->statePath('data');
    }

    /** @return array<int, Action> */
    protected function getHeaderActions(): array
    {
        return [
            Action::make('generate_menu')
                ->label(__('ai_studio.actions.generate'))
                ->icon('heroicon-o-sparkles')
                ->color('primary')
                ->action('generateMenu'),
            Action::make('translate')
                ->label(__('ai_studio.actions.translate'))
                ->icon('heroicon-o-language')
                ->color('primary')
                ->action('runTranslate'),
            Action::make('save_chatbot')
                ->label(__('ai_studio.actions.save_chatbot'))
                ->icon('heroicon-o-check')
                ->color('success')
                ->action('saveChatbotConfig'),
        ];
    }

    /** @return array<string, mixed> */
    protected function getViewData(): array
    {
        return [
            'insights' => $this->getInsightsState(),
            'isSuperAdmin' => $this->isSuperAdmin(),
            'tenant' => $this->resolveTenant()?->only(['id', 'name', 'slug', 'tier']),
        ];
    }

    protected function resolveTenant(): ?Tenant
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return null;
        }
        if ($user->tenant_id === null) {
            return null;
        }
        return Tenant::query()->withoutGlobalScopes()->find($user->tenant_id);
    }

    protected function isSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
