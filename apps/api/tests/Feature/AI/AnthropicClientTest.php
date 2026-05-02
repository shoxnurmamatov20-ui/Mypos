<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — AnthropicClient (Messages API wrapper)
|--------------------------------------------------------------------------
|
| Spec covered (Agent E2 — `App\Domain\AI\Services\AnthropicClient`):
|   - HTTP wrapper around `https://api.anthropic.com/v1/messages`
|   - Writes an `ai_generations_log` row on every call (success OR failure)
|   - Throws `AiDisabledException` when ANTHROPIC_ENABLED=false or key empty
|   - Throws `AnthropicException` on transport errors / non-2xx responses
|   - `estimateCost(usage)` returns USD with 6-decimal precision
|   - Captures wall-clock `duration_ms` per call (hrtime-based)
|   - Strips ```json fences via `extractJsonArray()` / `extractJsonObject()`
|
| All tests use `Http::fake()` so no real network calls. The pricing-config
| in `config/anthropic.php` is the source of truth for `estimateCost()`.
|
| Skip rules:
|   - Service class must exist (Agent E2 may not have shipped yet)
|   - The `ai_generations_log` table must be migrated
*/

use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Enums\AiGenerationStatus;
use App\Domain\AI\Exceptions\AiDisabledException;
use App\Domain\AI\Exceptions\AnthropicException;
use App\Domain\AI\Models\AiGenerationLog;
use App\Domain\AI\Services\AnthropicClient;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (! class_exists(AnthropicClient::class)) {
        $this->markTestSkipped('AnthropicClient not yet shipped (pending Agent E2).');
    }
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not yet migrated (pending Agent E1).');
    }

    // The audit-log insert path goes through BelongsToTenant. Tests run without
    // an authenticated user so we have to opt-in to lenient mode otherwise the
    // global scope's fail-closed branch poisons the create() call.
    BelongsToTenant::allowEmptyTenantContext(true);
});

afterEach(function (): void {
    BelongsToTenant::allowEmptyTenantContext(false);
});

/**
 * Build a fresh client with explicit constructor args. Bypasses the singleton
 * binding so we can flip `enabled`/api-key per test.
 */
function makeAnthropicClient(array $overrides = []): AnthropicClient
{
    $defaults = [
        'apiKey' => 'sk-ant-test-key',
        'model' => 'claude-opus-4-7',
        'baseUrl' => 'https://api.anthropic.com/v1',
        'apiVersion' => '2023-06-01',
        'timeoutSeconds' => 30,
        'enabled' => true,
    ];
    $args = array_merge($defaults, $overrides);

    return new AnthropicClient(
        apiKey: (string) $args['apiKey'],
        model: (string) $args['model'],
        baseUrl: (string) $args['baseUrl'],
        apiVersion: (string) $args['apiVersion'],
        timeoutSeconds: (int) $args['timeoutSeconds'],
        enabled: (bool) $args['enabled'],
    );
}

/**
 * Stub Anthropic Messages API success response with realistic shape.
 *
 * @param  array<int, array{type: string, text: string}>  $contentBlocks
 * @param  array{input_tokens: int, output_tokens: int}|null  $usage
 */
function fakeAnthropicSuccess(array $contentBlocks = [], ?array $usage = null): void
{
    Http::fake([
        '*api.anthropic.com/*' => Http::response([
            'id' => 'msg_' . bin2hex(random_bytes(8)),
            'type' => 'message',
            'role' => 'assistant',
            'model' => 'claude-opus-4-7',
            'content' => $contentBlocks === [] ? [['type' => 'text', 'text' => 'OK']] : $contentBlocks,
            'stop_reason' => 'end_turn',
            'usage' => $usage ?? ['input_tokens' => 25, 'output_tokens' => 80],
        ], 200),
    ]);
}

it('successfully calls Anthropic API and returns response', function (): void {
    fakeAnthropicSuccess([['type' => 'text', 'text' => 'Hello world']]);

    $client = makeAnthropicClient();
    $response = $client->message(
        AiFeature::Chatbot,
        'You are a helpful assistant.',
        'Say hello.',
    );

    expect($response)->toBeArray();
    expect($response['type'])->toBe('message');
    expect($client->extractText($response))->toBe('Hello world');
});

it('logs to ai_generations_log on success', function (): void {
    fakeAnthropicSuccess(
        [['type' => 'text', 'text' => 'response body']],
        ['input_tokens' => 100, 'output_tokens' => 250]
    );

    $before = AiGenerationLog::query()->withoutGlobalScopes()->count();

    $client = makeAnthropicClient();
    $client->message(AiFeature::MenuGenerator, 'system', 'user msg');

    $after = AiGenerationLog::query()->withoutGlobalScopes()->count();
    expect($after - $before)->toBe(1);

    $row = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->first();
    expect($row)->not->toBeNull();
    expect($row->feature instanceof AiFeature ? $row->feature->value : $row->feature)
        ->toBe(AiFeature::MenuGenerator->value);
    expect($row->input_tokens)->toBe(100);
    expect($row->output_tokens)->toBe(250);
    expect($row->status instanceof AiGenerationStatus ? $row->status->value : $row->status)
        ->toBe(AiGenerationStatus::Success->value);
});

it('logs error and re-throws on API failure (non-2xx)', function (): void {
    Http::fake([
        '*api.anthropic.com/*' => Http::response([
            'type' => 'error',
            'error' => ['type' => 'invalid_request_error', 'message' => 'bad payload'],
        ], 400),
    ]);

    $before = AiGenerationLog::query()->withoutGlobalScopes()->count();

    $client = makeAnthropicClient();
    expect(fn () => $client->message(AiFeature::Translator, 'sys', 'usr'))
        ->toThrow(AnthropicException::class);

    $after = AiGenerationLog::query()->withoutGlobalScopes()->count();
    expect($after - $before)->toBe(1);

    $row = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->first();
    expect($row)->not->toBeNull();
    expect($row->status instanceof AiGenerationStatus ? $row->status->value : $row->status)
        ->toBe(AiGenerationStatus::Error->value);
    expect((string) ($row->error_message ?? ''))->toContain('400');
});

it('throws AiDisabledException on missing API key', function (): void {
    $client = makeAnthropicClient(['apiKey' => '']);

    expect(fn () => $client->message(AiFeature::Chatbot, 'sys', 'usr'))
        ->toThrow(AiDisabledException::class);
});

it('throws AiDisabledException when enabled=false (master kill-switch)', function (): void {
    $client = makeAnthropicClient(['enabled' => false]);

    expect(fn () => $client->message(AiFeature::MenuGenerator, 'sys', 'usr'))
        ->toThrow(AiDisabledException::class);
});

it('estimates cost from token usage with 6-decimal USD precision', function (): void {
    $client = makeAnthropicClient(['model' => 'claude-opus-4-7']);

    // Opus 4.7 pricing per config: $15/1M input, $75/1M output.
    // 1,000,000 input tokens * $15 / 1M = $15.00
    // 1,000,000 output tokens * $75 / 1M = $75.00 → $90.00 total
    $cost = $client->estimateCost([
        'input_tokens' => 1_000_000,
        'output_tokens' => 1_000_000,
    ]);

    expect($cost)->toBeFloat();
    expect(round($cost, 2))->toBe(90.00);
});

it('estimates near-zero cost for tiny usage', function (): void {
    $client = makeAnthropicClient(['model' => 'claude-opus-4-7']);

    $cost = $client->estimateCost([
        'input_tokens' => 100,
        'output_tokens' => 50,
    ]);

    // 100 * 15 / 1M + 50 * 75 / 1M = 0.0015 + 0.00375 = 0.00525
    expect($cost)->toBe(0.00525);
});

it('captures duration_ms on the audit row', function (): void {
    fakeAnthropicSuccess();

    $client = makeAnthropicClient();
    $client->message(AiFeature::Description, 'sys', 'usr');

    $row = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->first();
    expect($row)->not->toBeNull();
    expect((int) $row->duration_ms)->toBeGreaterThanOrEqual(0);
    expect((int) $row->duration_ms)->toBeLessThan(60_000); // bounded sanity check
});

it('uses tenant-context resolution: null tenant_id when no auth user', function (): void {
    fakeAnthropicSuccess();

    $client = makeAnthropicClient();
    $client->message(AiFeature::Chatbot, 'sys', 'usr');

    $row = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->first();
    expect($row)->not->toBeNull();
    // No authenticated user → tenant_id stays null. The RLS policy + lenient
    // flag let this row through.
    expect($row->tenant_id)->toBeNull();
});

it('respects custom max_tokens override', function (): void {
    fakeAnthropicSuccess();

    $client = makeAnthropicClient();
    $client->message(
        AiFeature::Chatbot,
        'sys',
        'usr',
        99, // maxTokens
    );

    Http::assertSent(function ($request) {
        $payload = $request->data();
        return ($payload['max_tokens'] ?? null) === 99;
    });
});

it('strips ```json fences from response (extractJsonArray)', function (): void {
    $client = makeAnthropicClient();

    $fenced = "```json\n[{\"id\":1},{\"id\":2}]\n```";
    $items = $client->extractJsonArray($fenced);
    expect($items)->toHaveCount(2);
    expect($items[0])->toBe(['id' => 1]);
});

it('extracts a JSON object even with prose around it', function (): void {
    $client = makeAnthropicClient();

    $messy = "Sure! Here's the translation:\n```json\n{\"hello\":\"salom\"}\n```\nLet me know if you need more.";
    $obj = $client->extractJsonObject($messy);
    expect($obj)->toBe(['hello' => 'salom']);
});

it('returns empty array on invalid JSON in extractJsonArray', function (): void {
    $client = makeAnthropicClient();

    expect($client->extractJsonArray('No JSON anywhere in this text'))->toBe([]);
    expect($client->extractJsonArray('```json\n{not valid}\n```'))->toBe([]);
});

it('extracts text from successful Messages response', function (): void {
    $client = makeAnthropicClient();

    $response = [
        'content' => [
            ['type' => 'text', 'text' => 'first block'],
            ['type' => 'text', 'text' => 'second block'],
        ],
    ];

    expect($client->extractText($response))->toBe('first block');
});

it('feature parameter accepts both AiFeature enum and string', function (): void {
    fakeAnthropicSuccess();

    $client = makeAnthropicClient();

    // Enum form
    $client->message(AiFeature::MenuGenerator, 'sys', 'usr');
    // String form (legacy / 3rd party callers)
    $client->message('chatbot', 'sys', 'usr');

    $rows = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->limit(2)->get();
    expect($rows)->toHaveCount(2);
});
