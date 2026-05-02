<?php

declare(strict_types=1);

namespace App\Domain\AI\Services;

use App\Domain\AI\Contracts\AnthropicClientContract;
use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Enums\AiGenerationStatus;
use App\Domain\AI\Exceptions\AiDisabledException;
use App\Domain\AI\Exceptions\AnthropicException;
use App\Domain\AI\Models\AiGenerationLog;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request as RequestFacade;
use Throwable;

/**
 * Thin HTTP wrapper around the Anthropic Messages API.
 *
 * Why HTTP instead of the official SDK?
 *   - The SDK pulls in Guzzle separately and ships its own retry policy that
 *     fights with Laravel's `Http::retry()`. The Messages endpoint is small
 *     enough (one verb, JSON in/out) that re-implementing it with Laravel's
 *     fluent client keeps the dep tree lean and the tests straightforward.
 *   - Laravel's HTTP fakes work out of the box for our Pest suite — the SDK
 *     would require a custom mock layer.
 *
 * Implements {@see AnthropicClientContract} so Agent E3's chatbot / forecast
 * / insights services can type-hint against the interface. The contract
 * exposes a narrow surface (`message`, `conversation`); this class adds
 * helper methods like `extractJsonArray` for callers that already depend on
 * the concrete type (E2's menu generator).
 *
 * Side effects:
 *   - Every call writes an `ai_generations_log` row — both successes and
 *     failures. This is the source of truth for cost dashboards and per-tenant
 *     quota enforcement.
 *   - We never log secrets. Request payloads are persisted but the API key is
 *     in the header, not the body.
 *
 * Threading: stateless except for the `$apiKey` / `$model` constructor args,
 * so the container singleton is safe.
 */
class AnthropicClient implements AnthropicClientContract
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly string $baseUrl,
        private readonly string $apiVersion,
        private readonly int $timeoutSeconds,
        private readonly bool $enabled,
    ) {
    }

    /**
     * Send a single Messages API call.
     *
     * Per the {@see AnthropicClientContract} contract this is the single-turn
     * shorthand. The contract says `string $userMessage`; we widen it to
     * `string|array` so callers that already build a multi-turn `messages`
     * array (E2's menu generator) can re-use the same entrypoint. PHP-wise
     * widening parameters is LSP-compatible.
     *
     * @param  string|AiFeature  $usageType  Logged into ai_generations_log.feature.
     * @param  string  $systemPrompt
     * @param  string|array<int, array{role: string, content: string|array<int,mixed>}>  $userMessage
     *         Either a single string (treated as `{role:"user", content:<str>}`) or an
     *         existing messages-array (multi-turn conversations).
     * @param  int|null  $maxTokens  Defaults to feature-specific config value.
     * @param  array<string, mixed>  $extraOptions  Forwarded to the request body
     *         verbatim — useful for `temperature`, `top_p`, `stop_sequences`.
     * @return array<string, mixed> Raw decoded JSON response from Anthropic.
     *
     * @throws AiDisabledException  Master kill-switch / empty API key.
     * @throws AnthropicException   Upstream non-2xx or transport error.
     */
    public function message(
        string|AiFeature $usageType,
        string $systemPrompt,
        string|array $userMessage,
        ?int $maxTokens = null,
        array $extraOptions = [],
    ): array {
        $messages = is_array($userMessage)
            ? $userMessage
            : [['role' => 'user', 'content' => $userMessage]];

        return $this->dispatch(
            usageType: $usageType,
            systemPrompt: $systemPrompt,
            messages: $messages,
            maxTokens: $maxTokens,
            extraOptions: $extraOptions,
        );
    }

    /**
     * Multi-turn variant — used by the chatbot to pass `[user, assistant, ...]`
     * history. Matches the contract signature exactly so chatbot/forecast/
     * insights services can swap a fake in tests.
     *
     * @param  string  $usageType
     * @param  string  $systemPrompt
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  int  $maxTokens
     * @return array<string, mixed>
     */
    public function conversation(
        string $usageType,
        string $systemPrompt,
        array $messages,
        int $maxTokens = 1024,
    ): array {
        return $this->dispatch(
            usageType: $usageType,
            systemPrompt: $systemPrompt,
            messages: $messages,
            maxTokens: $maxTokens,
            extraOptions: [],
        );
    }

    /**
     * Internal sender shared by {@see message()} and {@see conversation()}.
     *
     * Builds the request body, performs the HTTP call, writes the audit log
     * row (success or failure), and surfaces the decoded response.
     *
     * @param  string|AiFeature  $usageType
     * @param  array<int, array{role: string, content: string|array<int,mixed>}>  $messages
     * @param  array<string, mixed>  $extraOptions
     * @return array<string, mixed>
     */
    private function dispatch(
        string|AiFeature $usageType,
        string $systemPrompt,
        array $messages,
        ?int $maxTokens,
        array $extraOptions,
    ): array {
        $this->ensureEnabled();

        $featureKey = $usageType instanceof AiFeature ? $usageType->value : $usageType;
        $maxTokens ??= (int) (config("anthropic.max_tokens.{$featureKey}")
            ?? config('anthropic.max_tokens.default')
            ?? 4096);

        $payload = array_merge([
            'model' => $this->model,
            'max_tokens' => $maxTokens,
            'system' => $systemPrompt,
            'messages' => $messages,
        ], $extraOptions);

        $start = hrtime(true);
        $auth = Auth::user();
        $tenantId = $auth?->tenant_id;
        $userId = $auth?->id;
        $ipAddress = $this->resolveIpAddress();

        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => $this->apiVersion,
                'content-type' => 'application/json',
            ])
                ->timeout($this->timeoutSeconds)
                ->post(rtrim($this->baseUrl, '/') . '/messages', $payload);
        } catch (Throwable $transport) {
            $this->writeFailureLog($featureKey, $tenantId, $userId, $ipAddress, $payload, $transport->getMessage(), $start);
            throw new AnthropicException('AI transport error: ' . $transport->getMessage(), 0, $transport);
        }

        $duration = $this->elapsedMs($start);

        if (! $response->successful()) {
            $body = (string) $response->body();
            $this->writeFailureLog(
                $featureKey,
                $tenantId,
                $userId,
                $ipAddress,
                $payload,
                "HTTP {$response->status()}: {$body}",
                $start,
            );
            throw new AnthropicException(
                "Anthropic API call failed (HTTP {$response->status()}): {$body}"
            );
        }

        /** @var array<string, mixed> $body */
        $body = (array) $response->json();

        $this->writeSuccessLog(
            featureKey: $featureKey,
            tenantId: $tenantId,
            userId: $userId,
            ipAddress: $ipAddress,
            payload: $payload,
            response: $body,
            durationMs: $duration,
        );

        return $body;
    }

    /**
     * Estimate USD cost from a usage block (`{input_tokens, output_tokens}`).
     * Public so the admin usage dashboard can re-compute totals from raw rows.
     *
     * @param  array<string, mixed>  $usage
     */
    public function estimateCost(array $usage, ?string $model = null): float
    {
        $modelKey = $model ?? $this->model;
        /** @var array<string, float> $pricing */
        $pricing = (array) (config("anthropic.pricing.{$modelKey}") ?? []);

        $inputRate = (float) ($pricing['input'] ?? 15.0);
        $outputRate = (float) ($pricing['output'] ?? 75.0);

        $inputCost = ((int) ($usage['input_tokens'] ?? 0)) * $inputRate / 1_000_000;
        $outputCost = ((int) ($usage['output_tokens'] ?? 0)) * $outputRate / 1_000_000;

        return round($inputCost + $outputCost, 6);
    }

    /**
     * Extract a JSON array from a Claude response body, stripping markdown
     * fences (```json ... ```) and anything around the array literal.
     *
     * Claude tends to wrap JSON in fences when the system prompt says
     * "JSON only" — this helper is forgiving so a stray fence doesn't
     * break the menu wizard.
     *
     * @return array<int, mixed>
     */
    public function extractJsonArray(string $text): array
    {
        $cleaned = $this->stripFences($text);

        // Locate the first `[` and the matching final `]` to guard against
        // commentary before / after the JSON block.
        $start = strpos($cleaned, '[');
        $end = strrpos($cleaned, ']');
        if ($start === false || $end === false || $end <= $start) {
            return [];
        }

        $candidate = substr($cleaned, $start, $end - $start + 1);
        /** @var mixed $decoded */
        $decoded = json_decode($candidate, true);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    /**
     * Same as {@see extractJsonArray} but for object-shaped responses
     * (used by the translator action which returns `{ key: { locale: text } }`).
     *
     * @return array<string, mixed>
     */
    public function extractJsonObject(string $text): array
    {
        $cleaned = $this->stripFences($text);
        $start = strpos($cleaned, '{');
        $end = strrpos($cleaned, '}');
        if ($start === false || $end === false || $end <= $start) {
            return [];
        }
        $candidate = substr($cleaned, $start, $end - $start + 1);
        /** @var mixed $decoded */
        $decoded = json_decode($candidate, true);

        return is_array($decoded) ? $decoded : [];
    }

    /** Convenience: pull the first text block from a successful Messages response. */
    public function extractText(array $response): string
    {
        $blocks = (array) ($response['content'] ?? []);
        foreach ($blocks as $block) {
            if (is_array($block) && ($block['type'] ?? '') === 'text' && isset($block['text'])) {
                return (string) $block['text'];
            }
        }
        return '';
    }

    private function ensureEnabled(): void
    {
        if (! $this->enabled) {
            throw new AiDisabledException('AI features are disabled (ANTHROPIC_ENABLED=false)');
        }
        if (trim($this->apiKey) === '') {
            throw new AiDisabledException('AI features are disabled (ANTHROPIC_API_KEY is empty)');
        }
    }

    private function writeSuccessLog(
        string $featureKey,
        ?string $tenantId,
        ?int $userId,
        ?string $ipAddress,
        array $payload,
        array $response,
        int $durationMs,
    ): void {
        $usage = (array) ($response['usage'] ?? []);
        $this->safeInsert([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'feature' => $featureKey,
            'model' => $this->model,
            'input_tokens' => (int) ($usage['input_tokens'] ?? 0),
            'output_tokens' => (int) ($usage['output_tokens'] ?? 0),
            'cost_usd' => $this->estimateCost($usage),
            'status' => AiGenerationStatus::Success->value,
            'duration_ms' => $durationMs,
            'request_payload' => $payload,
            'response_payload' => $response,
            'ip_address' => $ipAddress,
        ]);
    }

    private function writeFailureLog(
        string $featureKey,
        ?string $tenantId,
        ?int $userId,
        ?string $ipAddress,
        array $payload,
        string $errorMessage,
        int $startedAtHrtime,
    ): void {
        $this->safeInsert([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'feature' => $featureKey,
            'model' => $this->model,
            'input_tokens' => 0,
            'output_tokens' => 0,
            'cost_usd' => 0,
            'status' => AiGenerationStatus::Error->value,
            'error_message' => substr($errorMessage, 0, 4000),
            'duration_ms' => $this->elapsedMs($startedAtHrtime),
            'request_payload' => $payload,
            'ip_address' => $ipAddress,
        ]);
    }

    /**
     * Persist the audit row even when running outside an authenticated tenant
     * scope (public onboarding endpoint). The lenient flag is request-scoped
     * so we restore the previous value after writing.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function safeInsert(array $attributes): void
    {
        try {
            BelongsToTenant::allowEmptyTenantContext(true);
            AiGenerationLog::create($attributes);
        } catch (Throwable $e) {
            // Never let an audit failure break the user-facing flow — but log
            // it so we can fix the schema / connection.
            Log::error('ai.audit.insert_failed', [
                'feature' => $attributes['feature'] ?? null,
                'error' => $e->getMessage(),
            ]);
        } finally {
            BelongsToTenant::allowEmptyTenantContext(false);
        }
    }

    private function elapsedMs(int $startHrtime): int
    {
        return (int) ((hrtime(true) - $startHrtime) / 1_000_000);
    }

    private function resolveIpAddress(): ?string
    {
        try {
            $request = RequestFacade::instance();
            return $request?->ip();
        } catch (Throwable) {
            return null;
        }
    }

    private function stripFences(string $text): string
    {
        $trimmed = trim($text);
        // Remove leading ```json or ``` and trailing ``` if present.
        $trimmed = preg_replace('/^```(?:json|JSON)?\s*/m', '', $trimmed) ?? $trimmed;
        $trimmed = preg_replace('/```\s*$/m', '', $trimmed) ?? $trimmed;
        return $trimmed;
    }
}
