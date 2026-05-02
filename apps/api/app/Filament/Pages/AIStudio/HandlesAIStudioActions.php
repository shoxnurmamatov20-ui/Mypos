<?php

declare(strict_types=1);

namespace App\Filament\Pages\AIStudio;

use App\Domain\AI\Services\ChatbotService;
use App\Domain\AI\Services\DemandForecastService;
use App\Domain\Tenant\Enums\TenantTier;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TierFeatures;
use Filament\Notifications\Notification;
use Filament\Support\Exceptions\Halt;
use Throwable;

/**
 * Action handlers for {@see \App\Filament\Pages\AIStudio}.
 *
 * Extracted into a trait so the page class stays under the 400-line limit.
 * Host requirements: `resolveTenant(): ?Tenant`, `isSuperAdmin(): bool`,
 * `public array $data`, `public array $testChat`, `public string $testChatInput`.
 *
 * Domain Actions are invoked dynamically (`class_exists` + `app($class)`) so
 * the page compiles even before E2/E3 land their final actions; the user gets
 * a friendly "action unavailable" notification rather than a fatal error.
 */
trait HandlesAIStudioActions
{
    /**
     * Tab 1 — call GenerateMenuAction. Result lands in $data.menu.results.
     */
    public function generateMenu(): void
    {
        try {
            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }

            $params = (array) ($this->data['menu'] ?? []);
            $cuisine = (string) ($params['cuisine'] ?? 'lavash');
            $count = (int) ($params['item_count'] ?? 20);
            $locales = (array) ($params['locales'] ?? ['uz', 'ru']);

            $actionClass = '\\App\\Domain\\AI\\Actions\\GenerateMenuAction';
            if (! class_exists($actionClass)) {
                $this->notifyActionMissing($actionClass);
                return;
            }
            // GenerateMenuAction::__invoke(?Tenant, string $cuisine, int $count, ?array $locales)
            // returns array<int, GeneratedMenuItem>.
            $action = app($actionClass);
            $result = is_callable($action)
                ? $action($tenant, $cuisine, $count, $locales)
                : $action->execute($tenant, $cuisine, $count, $locales);

            $this->data['menu']['results'] = $this->normalizeMenuItems($result);

            Notification::make()
                ->title(__('ai_studio.notifications.generated'))
                ->body(__('ai_studio.notifications.generated_body', ['count' => count($this->data['menu']['results'])]))
                ->success()
                ->send();
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            $this->notifyError($e);
        }
    }

    /** Tab 1 — bulk-create generated items as MenuItem rows. */
    public function saveGeneratedMenu(): void
    {
        try {
            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }
            $items = (array) ($this->data['menu']['results'] ?? []);
            if ($items === []) {
                Notification::make()
                    ->title(__('ai_studio.notifications.no_items'))
                    ->warning()
                    ->send();
                return;
            }

            $actionClass = '\\App\\Domain\\Menu\\Actions\\BulkCreateMenuItemsAction';
            if (! class_exists($actionClass)) {
                $this->notifyActionMissing($actionClass);
                return;
            }
            $action = app($actionClass);
            $created = is_callable($action)
                ? $action($tenant, $items)
                : $action->execute($tenant, $items);

            Notification::make()
                ->title(__('ai_studio.notifications.saved'))
                ->body(__('ai_studio.notifications.saved_body', [
                    'count' => is_int($created) ? $created : count($items),
                ]))
                ->success()
                ->send();
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            $this->notifyError($e);
        }
    }

    /** Tab 2 — translate. */
    public function runTranslate(): void
    {
        try {
            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }

            $payload = (array) ($this->data['translate'] ?? []);
            $sourceText = (string) ($payload['source_text'] ?? '');
            $sourceLocale = (string) ($payload['source_locale'] ?? 'uz');
            $targetLocales = (array) ($payload['target_locales'] ?? []);

            if ($sourceText === '' || $targetLocales === []) {
                Notification::make()
                    ->title(__('ai_studio.notifications.translate_missing'))
                    ->warning()
                    ->send();
                return;
            }

            $actionClass = '\\App\\Domain\\AI\\Actions\\AutoTranslateAction';
            if (! class_exists($actionClass)) {
                $this->notifyActionMissing($actionClass);
                return;
            }
            // AutoTranslateAction::__invoke(string|array $source, string $sourceLocale, array $targets)
            // returns a TranslationBundle DTO, not a tenant.
            $action = app($actionClass);
            $result = is_callable($action)
                ? $action($sourceText, $sourceLocale, $targetLocales)
                : $action->execute($sourceText, $sourceLocale, $targetLocales);

            // Unwrap the TranslationBundle into a plain [locale => text] array
            // for the Blade view. Falls back to whatever the action returned
            // when the DTO contract changes.
            $translations = [];
            if (is_object($result) && property_exists($result, 'translations')) {
                $translations = (array) $result->translations;
            } elseif (is_array($result)) {
                $translations = $result;
            }

            $this->data['translate']['translations'] = $translations;

            Notification::make()
                ->title(__('ai_studio.notifications.translated'))
                ->success()
                ->send();
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            $this->notifyError($e);
        }
    }

    /** Tab 3 — persist chatbot config to tenants.settings.chatbot. */
    public function saveChatbotConfig(): void
    {
        try {
            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }
            $config = (array) ($this->data['chatbot'] ?? []);

            $settings = is_array($tenant->settings) ? $tenant->settings : [];
            $settings['chatbot'] = $config;
            $tenant->settings = $settings;
            $tenant->save();

            Notification::make()
                ->title(__('ai_studio.notifications.chatbot_saved'))
                ->success()
                ->send();
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            $this->notifyError($e);
        }
    }

    /** Tab 3 — send one test message to the chatbot. */
    public function sendTestChat(): void
    {
        $message = trim($this->testChatInput);
        if ($message === '') {
            return;
        }
        try {
            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }

            $this->testChat[] = ['role' => 'user', 'content' => $message];
            $this->testChatInput = '';

            if (! class_exists(ChatbotService::class)) {
                $this->testChat[] = [
                    'role' => 'assistant',
                    'content' => __('ai_studio.notifications.chatbot_unavailable'),
                ];
                return;
            }

            /** @var ChatbotService $service */
            $service = app(ChatbotService::class);
            $reply = $service->reply(
                tenant: $tenant,
                userMessage: $message,
                customer: null,
                sessionId: 'admin-test-' . session()->getId(),
                locale: app()->getLocale(),
            );

            $this->testChat[] = [
                'role' => 'assistant',
                'content' => (string) ($reply['reply'] ?? '—'),
            ];
        } catch (Throwable $e) {
            $this->testChat[] = [
                'role' => 'assistant',
                'content' => __('ai_studio.notifications.chatbot_error', ['msg' => $e->getMessage()]),
            ];
        }
    }

    public function resetTestChat(): void
    {
        $this->testChat = [];
        $this->testChatInput = '';
    }

    /** Tab 4 — Enterprise narrative report. */
    public function generateInsightsReport(): void
    {
        try {
            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }
            $tier = TierFeatures::for($tenant->getAttribute('tier'));
            if (! $tier->tier->atLeast(TenantTier::Enterprise) && ! $this->isSuperAdmin()) {
                throw new Halt('Enterprise tier required.');
            }

            $actionClass = '\\App\\Domain\\AI\\Actions\\AnalyzeRestaurantInsightsAction';
            if (! class_exists($actionClass)) {
                $this->notifyActionMissing($actionClass);
                return;
            }
            $action = app($actionClass);
            $report = is_callable($action) ? $action($tenant) : $action->execute($tenant);

            $this->data['insights']['report'] = is_array($report)
                ? $report
                : ['narrative' => (string) $report];

            Notification::make()
                ->title(__('ai_studio.notifications.insights_generated'))
                ->success()
                ->send();
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            $this->notifyError($e);
        }
    }

    /**
     * Demand-forecast snapshot used by the insights tab Blade view.
     *
     * @return array{
     *     top_items: array<int, array<string, mixed>>,
     *     predicted: array<int, array<string, mixed>>,
     *     low_sellers: array<int, array<string, mixed>>,
     *     enterprise: bool,
     *     report: array<string, mixed>|null,
     * }
     */
    public function getInsightsState(): array
    {
        $tenant = $this->resolveTenant();
        if ($tenant === null) {
            return [
                'top_items' => [],
                'predicted' => [],
                'low_sellers' => [],
                'enterprise' => $this->isSuperAdmin(),
                'report' => null,
            ];
        }

        $insights = ['top_items' => [], 'predicted' => [], 'low_sellers' => []];
        try {
            /** @var DemandForecastService $svc */
            $svc = app(DemandForecastService::class);
            $insights['top_items'] = $svc->topItemsForRestaurant($tenant, 30);
            $insights['predicted'] = $svc->predictNextWeek($tenant);
            $insights['low_sellers'] = $svc->lowSellersToRetire($tenant, 60);
        } catch (Throwable) {
            // Empty arrays on failure — view never errors out.
        }

        return [
            'top_items' => $insights['top_items'],
            'predicted' => $insights['predicted'],
            'low_sellers' => $insights['low_sellers'],
            'enterprise' => TierFeatures::for($tenant->getAttribute('tier'))
                ->tier->atLeast(TenantTier::Enterprise) || $this->isSuperAdmin(),
            'report' => is_array($this->data['insights']['report'] ?? null)
                ? $this->data['insights']['report']
                : null,
        ];
    }

    /**
     * Convert a list of GeneratedMenuItem DTOs (or raw arrays) into the flat
     * `[name_uz, name_ru, name_en, price, category, description]` shape that
     * the Tab 1 Repeater renders. Falls through gracefully when E2 changes the
     * DTO contract.
     *
     * @param  mixed  $result
     * @return list<array<string, mixed>>
     */
    private function normalizeMenuItems(mixed $result): array
    {
        if (! is_array($result) && ! (is_object($result) && method_exists($result, 'toArray'))) {
            return [];
        }
        $list = is_array($result) ? $result : (array) $result->toArray();

        $out = [];
        foreach ($list as $item) {
            if (is_object($item) && method_exists($item, 'toArray')) {
                $row = $item->toArray();
            } elseif (is_array($item)) {
                $row = $item;
            } else {
                continue;
            }

            $name = is_array($row['name'] ?? null) ? $row['name'] : [];
            $description = is_array($row['description'] ?? null) ? $row['description'] : [];

            $out[] = [
                'name_uz' => (string) ($name['uz'] ?? ''),
                'name_ru' => (string) ($name['ru'] ?? ''),
                'name_en' => (string) ($name['en'] ?? ''),
                'price' => (int) ($row['suggested_price_minor'] ?? $row['price'] ?? 0),
                'category' => (string) ($row['category'] ?? 'main'),
                'description' => (string) (
                    $description[app()->getLocale()]
                    ?? $description['en']
                    ?? $description['uz']
                    ?? (is_string($row['description'] ?? null) ? $row['description'] : '')
                ),
            ];
        }
        return $out;
    }

    private function notifyActionMissing(string $class): void
    {
        Notification::make()
            ->title(__('ai_studio.notifications.action_missing'))
            ->body(__('ai_studio.notifications.action_missing_body', ['class' => $class]))
            ->warning()
            ->send();
    }

    private function notifyError(Throwable $e): void
    {
        Notification::make()
            ->title(__('ai_studio.notifications.error'))
            ->body($e->getMessage())
            ->danger()
            ->send();
    }

    /** @return Tenant|null Implemented by the host page class. */
    abstract protected function resolveTenant(): ?Tenant;

    abstract protected function isSuperAdmin(): bool;
}
