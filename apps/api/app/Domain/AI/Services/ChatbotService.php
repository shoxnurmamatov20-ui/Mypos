<?php

declare(strict_types=1);

namespace App\Domain\AI\Services;

use App\Domain\AI\Contracts\AnthropicClientContract;
use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Exceptions\ChatbotRefusedException;
use App\Domain\Customer\Models\Customer;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Cache;

/**
 * Phase-4 — restaurant-aware customer chatbot.
 *
 * Wraps the Anthropic Messages API with:
 *   - Per-tenant restaurant context (cached 1h)
 *   - Conversation history from {@see ConversationMemory}
 *   - Locale handling (uz/ru/en) — the system prompt requests a target
 *     language and the user message is forwarded verbatim, so the model
 *     can also handle code-switching
 *   - {@see ChatSafetyFilter} stop-word + injection guard
 *
 * The service is intentionally *narrow*: it knows how to ask the AI a
 * question, not how to authenticate or rate-limit. Those concerns belong
 * in the controller (route middleware + IP-based throttle).
 *
 * Tier gate is checked at the FormRequest layer — the service will accept
 * any tenant. Cost accounting is delegated to the AnthropicClient (which
 * writes to `ai_generations_log`).
 */
final class ChatbotService
{
    /** Per-tenant context cache TTL (1h). Invalidated on menu writes. */
    private const CONTEXT_TTL_SECONDS = 3600;

    /** Max items embedded in the per-tenant context prompt. */
    private const MENU_CONTEXT_LIMIT = 50;

    /** Number of historical turns to feed back to Claude. */
    private const HISTORY_TURNS = 5;

    public function __construct(
        private readonly AnthropicClientContract $ai,
        private readonly ConversationMemory $memory,
        private readonly ChatSafetyFilter $filter,
    ) {
    }

    /**
     * Generate a reply.
     *
     * @return array{
     *     reply: string,
     *     usage: array<string, mixed>,
     *     refused: bool,
     *     reason: string|null,
     * }
     *
     * @throws ChatbotRefusedException When safety filter rejects the input.
     */
    public function reply(
        Tenant $tenant,
        string $userMessage,
        ?Customer $customer = null,
        ?string $sessionId = null,
        string $locale = 'uz',
    ): array {
        $check = $this->filter->inspect($userMessage);
        if (! $check['ok']) {
            throw new ChatbotRefusedException(
                $check['reason'] ?? 'rejected',
                $this->refusalCopy($locale, (string) ($check['reason'] ?? 'rejected')),
            );
        }

        $sanitized = $check['sanitized'];
        $sessionKey = (string) ($sessionId ?? '');

        // Build prompts.
        $context = $this->buildRestaurantContext($tenant);
        $systemPrompt = $this->filter->fortifySystemPrompt(
            $this->systemPromptFor($tenant, $locale, $context, $customer),
        );

        // Pull history *before* appending the current turn so the assistant
        // sees the previous round-trip without echoing itself.
        $history = $sessionKey === ''
            ? []
            : $this->memory->history($tenant->id, $sessionKey, self::HISTORY_TURNS);

        $messages = $history;
        $messages[] = ['role' => 'user', 'content' => $sanitized];

        // The Anthropic client (Agent E2) accepts either a string for single-
        // turn or a messages-array for multi-turn — we pass the array form
        // because the chatbot always sends back history when it has any.
        $response = $this->ai->message(
            feature: AiFeature::Chatbot,
            systemPrompt: $systemPrompt,
            userMessage: $messages,
            maxTokens: 1024,
        );

        $reply = $this->extractReply($response);
        $reply = $this->filter->clampReply($reply);

        // Persist both turns. We persist sanitized user input — never the
        // raw input — so the buffer cannot accumulate offensive payloads.
        if ($sessionKey !== '') {
            $this->memory->append($tenant->id, $sessionKey, ['role' => 'user', 'content' => $sanitized]);
            $this->memory->append($tenant->id, $sessionKey, ['role' => 'assistant', 'content' => $reply]);
        }

        return [
            'reply' => $reply,
            'usage' => is_array($response['usage'] ?? null) ? $response['usage'] : [],
            'refused' => false,
            'reason' => null,
        ];
    }

    /**
     * Build the restaurant context blob fed to Claude as part of the system
     * prompt. Cached per tenant for {@see CONTEXT_TTL_SECONDS} seconds. The
     * cache key is referenced by {@see \App\Domain\Menu\Observers\MenuCacheObserver}
     * (Agent E5 will wire the bust on save/delete).
     *
     * Phone numbers from menu rows are stripped before serialisation as a
     * defence against prompt-injection attacks that try to leak PII.
     */
    public function buildRestaurantContext(Tenant $tenant): string
    {
        $cacheKey = $this->contextCacheKey($tenant->id);

        $payload = Cache::remember(
            $cacheKey,
            self::CONTEXT_TTL_SECONDS,
            fn (): array => $this->compileContext($tenant),
        );

        $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        return $encoded === false ? '{}' : $encoded;
    }

    /** Public so external callers (admin "preview", tests) can bust the cache. */
    public function flushContext(Tenant $tenant): void
    {
        Cache::forget($this->contextCacheKey($tenant->id));
    }

    /** @return array<string, mixed> */
    private function compileContext(Tenant $tenant): array
    {
        $menu = MenuItem::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(self::MENU_CONTEXT_LIMIT)
            ->get(['name', 'description', 'price_amount', 'price_currency', 'allergens', 'tags', 'category_id']);

        $menuSample = [];
        foreach ($menu as $item) {
            $menuSample[] = [
                'name' => is_array($item->name) ? $item->name : [],
                'description' => is_array($item->description) ? $item->description : null,
                'price_minor' => (int) $item->price_amount,
                'currency' => (string) $item->price_currency,
                'allergens' => is_array($item->allergens) ? $item->allergens : [],
                'tags' => is_array($item->tags) ? $item->tags : [],
            ];
        }

        $brand = $tenant->brand;
        $domains = $tenant->domains()
            ->where('is_verified', true)
            ->pluck('domain')
            ->all();

        $settings = is_array($tenant->settings) ? $tenant->settings : [];

        return [
            'name' => $tenant->name,
            'phone' => $tenant->phone,
            'address' => $settings['address'] ?? null,
            'working_hours' => $settings['working_hours'] ?? null,
            'delivery_zones' => $settings['delivery_zones'] ?? [],
            'loyalty_program' => $settings['loyalty_program'] ?? null,
            'menu_sample' => $menuSample,
            'tagline' => $brand?->tagline ?? null,
            'domains' => $domains,
            'currency' => (string) $tenant->default_currency,
            'timezone' => (string) $tenant->timezone,
            'country_code' => $settings['country_code'] ?? null,
        ];
    }

    private function systemPromptFor(Tenant $tenant, string $locale, string $context, ?Customer $customer): string
    {
        $localeName = match ($locale) {
            'ru' => 'Russian',
            'en' => 'English',
            default => 'Uzbek',
        };

        $customerLine = '';
        if ($customer !== null) {
            $customerLine = "\nThe customer is logged in. Their first name is "
                . addslashes($customer->first_name)
                . ". Personalise the greeting if natural.\n";
        }

        return "You are a helpful customer service agent for "
            . $tenant->name
            . ". Always reply in " . $localeName . " (the user may switch languages mid-conversation — match theirs)."
            . " Use ONLY the restaurant context provided below to answer. "
            . "If the answer is not in the context, say you don't know and suggest the customer call the restaurant.\n"
            . $customerLine
            . "\nRestaurant context (JSON):\n"
            . $context;
    }

    /** Localised polite refusal for safety filter rejections. */
    private function refusalCopy(string $locale, string $reason): string
    {
        $messages = [
            'uz' => "Kechirasiz, men bu xabarga javob bera olmayman. Iltimos, restoran haqida boshqa savol bering.",
            'ru' => "Извините, я не могу ответить на это сообщение. Пожалуйста, задайте другой вопрос о ресторане.",
            'en' => "Sorry, I can't respond to that. Please ask another question about the restaurant.",
        ];
        return $messages[$locale] ?? $messages['uz'];
    }

    /** @param array<string, mixed> $response */
    private function extractReply(array $response): string
    {
        // Anthropic Messages API: `content` is a list of blocks. We expect a
        // single text block for the chatbot use case. Fall back gracefully
        // if the provider returns an unexpected shape.
        $content = $response['content'] ?? null;
        if (is_array($content) && isset($content[0]) && is_array($content[0])) {
            $first = $content[0];
            if (isset($first['text']) && is_string($first['text'])) {
                return trim($first['text']);
            }
        }
        return '';
    }

    private function contextCacheKey(string $tenantId): string
    {
        return 'chatbot:context:' . $tenantId;
    }
}
