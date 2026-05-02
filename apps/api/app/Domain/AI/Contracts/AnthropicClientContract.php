<?php

declare(strict_types=1);

namespace App\Domain\AI\Contracts;

use App\Domain\AI\Enums\AiFeature;

/**
 * Phase-4 contract for the Anthropic Messages API client.
 *
 * Owned by Agent E2 — concrete implementation lives at
 * {@see \App\Domain\AI\Services\AnthropicClient}. This contract is published
 * here so other agents (E3 forecasting + chatbot, E5 Filament, E7 tests) can
 * type-hint against the interface and swap a fake in tests.
 *
 * The `message` method handles both single-turn (string `$userMessage`) and
 * multi-turn (`array<int, array{role, content}>` `$userMessage`) cases —
 * the implementation wraps a string into `[{role: 'user', content: …}]` so
 * a single-turn caller doesn't have to.
 *
 * Returns the raw Messages API response shape, decoded to an associative
 * array. Keys callers care about:
 *
 *   - `content[0].text` → string with the assistant reply
 *   - `usage.input_tokens` / `usage.output_tokens` → int
 *   - `stop_reason` → 'end_turn' | 'max_tokens' | …
 *
 * The `$feature` parameter is logged into `ai_generations_log.feature` so
 * the platform-admin cost dashboard can split usage by surface
 * (`menu`, `forecast`, `chatbot`, `insights`).
 */
interface AnthropicClientContract
{
    /**
     * Send a Messages API call.
     *
     * @param  string|AiFeature  $feature  Logged into `ai_generations_log.feature`.
     * @param  string  $systemPrompt  System prompt — appended verbatim.
     * @param  string|array<int, array{role: string, content: string|array<int, mixed>}>  $userMessage
     *         A single string is wrapped into `[{role: user, content: …}]`.
     *         An array is forwarded verbatim — must end on a user turn.
     * @param  int|null  $maxTokens  Hard ceiling on `max_tokens`. When null
     *         the implementation reads `config('anthropic.max_tokens.{feature}')`.
     * @param  array<string, mixed>  $extraOptions  Forwarded to the request
     *         body (e.g. `temperature`, `top_p`, `stop_sequences`).
     * @return array<string, mixed>  Raw Messages API response.
     */
    public function message(
        string|AiFeature $feature,
        string $systemPrompt,
        string|array $userMessage,
        ?int $maxTokens = null,
        array $extraOptions = [],
    ): array;
}
