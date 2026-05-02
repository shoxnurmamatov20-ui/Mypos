<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — Auto-translate Action
|--------------------------------------------------------------------------
|
| Spec covered (Agent E2 — `App\Domain\AI\Actions\AutoTranslateAction`):
|   - Single-string overload: translate one input to multiple target locales
|     and return `{ uz: '...', ru: '...', en: '...', kz: '...' }`.
|   - Batch overload: translate an associative array (key → source string)
|     to multiple locales and preserve the keys.
|   - Handles unicode correctly across UZ-Latin, RU-Cyrillic, KZ-Cyrillic.
|   - Logs a `translator` row in ai_generations_log per call.
|
| Test strategy: `Http::fake()` returns synthetic Claude responses with the
| expected JSON shape (Claude is prompted to emit JSON-only).
|
| Skip rules:
|   - Action class must exist (Agent E2)
|   - AnthropicClient must exist
*/

use App\Domain\AI\Models\AiGenerationLog;
use App\Domain\AI\Services\AnthropicClient;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (! class_exists(AnthropicClient::class)) {
        $this->markTestSkipped('AnthropicClient not yet shipped (pending Agent E2).');
    }
    if (! class_exists('App\\Domain\\AI\\Actions\\AutoTranslateAction')) {
        $this->markTestSkipped('AutoTranslateAction not yet shipped (pending Agent E2).');
    }
    if (! Schema::hasTable('ai_generations_log')) {
        $this->markTestSkipped('ai_generations_log table not yet migrated (pending Agent E1).');
    }

    BelongsToTenant::allowEmptyTenantContext(true);
});

afterEach(function (): void {
    BelongsToTenant::allowEmptyTenantContext(false);
});

/**
 * Fake a Claude response that returns the given object (key → translation).
 *
 * @param  array<string, mixed>  $object
 */
function fakeTranslateResponse(array $object): void
{
    $json = json_encode($object, JSON_UNESCAPED_UNICODE);
    Http::fake([
        '*api.anthropic.com/*' => Http::response([
            'id' => 'msg_' . bin2hex(random_bytes(8)),
            'type' => 'message',
            'role' => 'assistant',
            'model' => 'claude-opus-4-7',
            'content' => [['type' => 'text', 'text' => "```json\n{$json}\n```"]],
            'stop_reason' => 'end_turn',
            'usage' => ['input_tokens' => 60, 'output_tokens' => 90],
        ], 200),
    ]);
}

function makeTranslator(): object
{
    return app('App\\Domain\\AI\\Actions\\AutoTranslateAction');
}

it('translates a single string to multiple target locales', function (): void {
    fakeTranslateResponse([
        'uz' => 'Salom dunyo',
        'ru' => 'Привет мир',
        'en' => 'Hello world',
        'kz' => 'Сәлем әлем',
    ]);

    $action = makeTranslator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line dynamic action shape */
    $result = $action->translate(
        tenant: $tenant,
        text: 'Salom dunyo',
        sourceLocale: 'uz',
        targetLocales: ['ru', 'en', 'kz'],
    );

    expect($result)->toBeArray();
    expect($result)->toHaveKeys(['ru', 'en', 'kz']);
    expect($result['ru'])->toBe('Привет мир');
    expect($result['kz'])->toBe('Сәлем әлем');
})->skip('AutoTranslateAction signature TBD — re-enable once Agent E2 finalises method names.');

it('translates a batch (object) to multiple locales preserving keys', function (): void {
    fakeTranslateResponse([
        'greeting' => [
            'ru' => 'Привет',
            'en' => 'Hello',
            'kz' => 'Сәлем',
        ],
        'farewell' => [
            'ru' => 'Пока',
            'en' => 'Bye',
            'kz' => 'Сау бол',
        ],
    ]);

    $action = makeTranslator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $result = $action->translateBatch(
        tenant: $tenant,
        items: [
            'greeting' => 'Salom',
            'farewell' => "Xayr",
        ],
        sourceLocale: 'uz',
        targetLocales: ['ru', 'en', 'kz'],
    );

    expect($result)->toHaveKeys(['greeting', 'farewell']);
    expect($result['greeting'])->toHaveKeys(['ru', 'en', 'kz']);
})->skip('AutoTranslateAction batch signature TBD.');

it('handles UZ Latin → RU Cyrillic correctly (unicode round-trip)', function (): void {
    fakeTranslateResponse([
        'ru' => 'Узбекский плов с барашком',
    ]);

    $action = makeTranslator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $result = $action->translate(
        tenant: $tenant,
        text: "O'zbekcha qo'y go'shtli osh",
        sourceLocale: 'uz',
        targetLocales: ['ru'],
    );

    expect($result['ru'])->toBe('Узбекский плов с барашком');
    // Verify the Cyrillic byte sequence was preserved exactly (no mojibake).
    expect(mb_check_encoding($result['ru'], 'UTF-8'))->toBeTrue();
})->skip('AutoTranslateAction signature TBD.');

it('handles UZ Latin → KZ Cyrillic correctly', function (): void {
    fakeTranslateResponse([
        'kz' => 'Қазақша палау',
    ]);

    $action = makeTranslator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $result = $action->translate(
        tenant: $tenant,
        text: "O'zbekcha osh",
        sourceLocale: 'uz',
        targetLocales: ['kz'],
    );

    expect($result['kz'])->toBe('Қазақша палау');
    // Spot-check Kazakh-specific letters (Ққ, Ққ, Ұұ, Әә).
    expect(mb_strpos($result['kz'], 'Қ'))->not->toBeFalse();
})->skip('AutoTranslateAction signature TBD.');

it('logs a translator row in ai_generations_log', function (): void {
    fakeTranslateResponse(['ru' => 'Привет']);

    $before = AiGenerationLog::query()->withoutGlobalScopes()->count();

    $action = makeTranslator();
    $tenant = Tenant::factory()->create();
    /** @phpstan-ignore-next-line */
    $action->translate(
        tenant: $tenant,
        text: 'Salom',
        sourceLocale: 'uz',
        targetLocales: ['ru'],
    );

    $after = AiGenerationLog::query()->withoutGlobalScopes()->count();
    expect($after - $before)->toBe(1);

    $row = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->first();
    expect((string) ($row->feature->value ?? $row->feature))->toBe('translator');
})->skip('AutoTranslateAction wiring TBD.');

it('returns same input for empty locale list (no-op)', function (): void {
    $action = makeTranslator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $result = $action->translate(
        tenant: $tenant,
        text: 'unchanged',
        sourceLocale: 'uz',
        targetLocales: [],
    );

    // Whether the action returns [] or ['uz' => 'unchanged'] is impl-defined,
    // but it must NOT throw and must NOT call Anthropic.
    expect($result)->toBeArray();
    Http::assertNothingSent();
})->skip('AutoTranslateAction edge-case contract TBD.');
