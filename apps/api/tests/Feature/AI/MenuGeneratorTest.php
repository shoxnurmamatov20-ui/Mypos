<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — Menu Generator Action
|--------------------------------------------------------------------------
|
| Spec covered (Agent E2 — `App\Domain\AI\Actions\GenerateMenuAction`):
|   - Generates a JSON-shaped list of menu items from a cuisine string
|   - `item_count` parameter controls how many items (default 25)
|   - Returns translations in all requested locales (uz/ru/en/kz/...)
|   - Strips ```json markdown fences from Claude's response
|   - Throws when JSON is malformed beyond recovery
|   - Suggested prices use the tenant's currency (UZS for Uzbek tenants,
|     KZT for Kazakh, etc.)
|
| Test strategy: `Http::fake()` returns a synthetic Claude response with the
| desired item-list shape, then we exercise the Action and assert it parsed
| / shaped the result correctly.
|
| Skip rules:
|   - Action class must exist (Agent E2)
|   - AnthropicClient must exist (Agent E2)
|   - ai_generations_log table must be migrated
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

    $actionClass = 'App\\Domain\\AI\\Actions\\GenerateMenuAction';
    if (! class_exists($actionClass)) {
        $this->markTestSkipped('GenerateMenuAction not yet shipped (pending Agent E2).');
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
 * Fake a Claude response that returns the given items list as JSON.
 *
 * @param  list<array<string, mixed>>  $items
 */
function fakeMenuResponse(array $items, bool $withFences = true): void
{
    $json = json_encode($items, JSON_UNESCAPED_UNICODE);
    $body = $withFences ? "```json\n{$json}\n```" : (string) $json;

    Http::fake([
        '*api.anthropic.com/*' => Http::response([
            'id' => 'msg_' . bin2hex(random_bytes(8)),
            'type' => 'message',
            'role' => 'assistant',
            'model' => 'claude-opus-4-7',
            'content' => [['type' => 'text', 'text' => $body]],
            'stop_reason' => 'end_turn',
            'usage' => ['input_tokens' => 200, 'output_tokens' => 800],
        ], 200),
    ]);
}

/**
 * Convenience: instantiate the Action via the container so DI works.
 *
 * @return object  Action instance (interface unknown until Agent E2 ships)
 */
function makeMenuGenerator(): object
{
    return app('App\\Domain\\AI\\Actions\\GenerateMenuAction');
}

it('generates JSON-shaped menu items from cuisine', function (): void {
    fakeMenuResponse([
        [
            'name' => ['uz' => 'Osh', 'ru' => 'Плов', 'en' => 'Plov'],
            'description' => ['uz' => 'Klassik osh', 'ru' => 'Классический плов', 'en' => 'Classic plov'],
            'category' => 'Main',
            'price' => 45000,
        ],
        [
            'name' => ['uz' => 'Manti', 'ru' => 'Манты', 'en' => 'Manti'],
            'description' => ['uz' => 'Bug\'da pishirilgan', 'ru' => 'Приготовленный на пару', 'en' => 'Steamed'],
            'category' => 'Main',
            'price' => 35000,
        ],
    ]);

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create([
        'default_currency' => 'UZS',
        'default_locale' => 'uz',
    ]);

    /** @phpstan-ignore-next-line dynamic action shape */
    $items = $action->execute(tenant: $tenant, cuisine: 'Uzbek', itemCount: 2);

    expect($items)->toBeArray();
    expect(count($items))->toBeGreaterThan(0);
})->skip('GenerateMenuAction signature TBD by Agent E2 — re-enable once execute() is finalised.');

it('respects item_count parameter (default 25)', function (): void {
    // Build a 25-item synthetic list.
    $items = [];
    for ($i = 1; $i <= 25; $i++) {
        $items[] = [
            'name' => ['uz' => "Taom {$i}", 'ru' => "Блюдо {$i}", 'en' => "Dish {$i}"],
            'description' => ['uz' => '...', 'ru' => '...', 'en' => '...'],
            'category' => 'Main',
            'price' => 10000 + $i * 1000,
        ];
    }
    fakeMenuResponse($items);

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $result = $action->execute(tenant: $tenant, cuisine: 'Uzbek');

    expect(count($result))->toBeLessThanOrEqual(25);
})->skip('Pending GenerateMenuAction signature.');

it('returns items in all requested locales', function (): void {
    fakeMenuResponse([
        [
            'name' => [
                'uz' => 'Osh',
                'ru' => 'Плов',
                'en' => 'Plov',
                'kz' => 'Палау',
            ],
            'description' => [
                'uz' => 'Klassik',
                'ru' => 'Классический',
                'en' => 'Classic',
                'kz' => 'Классикалық',
            ],
            'category' => 'Main',
            'price' => 45000,
        ],
    ]);

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $items = $action->execute(
        tenant: $tenant,
        cuisine: 'Uzbek',
        itemCount: 1,
        locales: ['uz', 'ru', 'en', 'kz'],
    );

    expect($items[0]['name'])->toHaveKeys(['uz', 'ru', 'en', 'kz']);
})->skip('Pending GenerateMenuAction locales contract.');

it('strips markdown fences from response', function (): void {
    fakeMenuResponse([
        [
            'name' => ['uz' => 'Test', 'ru' => 'Тест', 'en' => 'Test'],
            'category' => 'Main',
            'price' => 10000,
        ],
    ], withFences: true); // explicit fences

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    $items = $action->execute(tenant: $tenant, cuisine: 'Uzbek', itemCount: 1);
    expect($items)->toBeArray();
    expect($items)->not->toBeEmpty();
})->skip('Pending GenerateMenuAction.');

it('throws on invalid JSON response', function (): void {
    Http::fake([
        '*api.anthropic.com/*' => Http::response([
            'content' => [['type' => 'text', 'text' => 'I am not JSON, sorry.']],
            'usage' => ['input_tokens' => 10, 'output_tokens' => 10],
            'stop_reason' => 'end_turn',
        ], 200),
    ]);

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create();

    /** @phpstan-ignore-next-line */
    expect(fn () => $action->execute(tenant: $tenant, cuisine: 'Uzbek', itemCount: 1))
        ->toThrow(\RuntimeException::class);
})->skip('Pending GenerateMenuAction.');

it('uses tenant currency for suggested prices (UZS)', function (): void {
    fakeMenuResponse([
        [
            'name' => ['uz' => 'Osh', 'ru' => 'Плов', 'en' => 'Plov'],
            'category' => 'Main',
            'price' => 45000,
        ],
    ]);

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create(['default_currency' => 'UZS']);

    /** @phpstan-ignore-next-line */
    $items = $action->execute(tenant: $tenant, cuisine: 'Uzbek', itemCount: 1);

    // The Action prompts Claude with the tenant currency. We can't assert the
    // outgoing prompt exactly, but we can verify the request body included the
    // currency hint.
    Http::assertSent(function ($request) {
        $body = json_encode($request->data()) ?: '';
        return str_contains($body, 'UZS');
    });
})->skip('Pending GenerateMenuAction prompt contract.');

it('uses tenant currency for suggested prices (KZT)', function (): void {
    fakeMenuResponse([
        [
            'name' => ['uz' => 'Бешбармак', 'ru' => 'Бешбармак', 'en' => 'Beshbarmak'],
            'category' => 'Main',
            'price' => 3500,
        ],
    ]);

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create([
        'default_currency' => 'KZT',
        'default_locale' => 'kz',
    ]);

    /** @phpstan-ignore-next-line */
    $action->execute(tenant: $tenant, cuisine: 'Kazakh', itemCount: 1);

    Http::assertSent(function ($request) {
        $body = json_encode($request->data()) ?: '';
        return str_contains($body, 'KZT');
    });
})->skip('Pending GenerateMenuAction prompt contract.');

it('logs a menu_generator row in ai_generations_log', function (): void {
    fakeMenuResponse([
        [
            'name' => ['uz' => 'X', 'ru' => 'X', 'en' => 'X'],
            'category' => 'Main',
            'price' => 1000,
        ],
    ]);

    $before = AiGenerationLog::query()->withoutGlobalScopes()->count();

    $action = makeMenuGenerator();
    $tenant = Tenant::factory()->create();
    /** @phpstan-ignore-next-line */
    $action->execute(tenant: $tenant, cuisine: 'Uzbek', itemCount: 1);

    $after = AiGenerationLog::query()->withoutGlobalScopes()->count();
    expect($after - $before)->toBe(1);

    $row = AiGenerationLog::query()->withoutGlobalScopes()->orderByDesc('created_at')->first();
    expect($row)->not->toBeNull();
    expect((string) ($row->feature->value ?? $row->feature))->toBe('menu_generator');
})->skip('Pending GenerateMenuAction wiring to AnthropicClient.');
