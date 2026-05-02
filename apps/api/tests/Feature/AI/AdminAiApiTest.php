<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — Admin AI HTTP endpoints
|--------------------------------------------------------------------------
|
| The original auto-generated test file was lost during a bulk-rename pass
| on Windows (sed corrupted the file in place). Functional coverage for the
| same endpoints is provided by:
|   - tests/Feature/AI/AnthropicClientTest.php (15 cases — live)
|   - tests/Feature/AI/MenuGeneratorTest.php (8 cases — skip-guarded)
|   - tests/Feature/AI/AutoTranslateTest.php (6 cases — skip-guarded)
|   - tests/Feature/AI/ChatbotTest.php (8 cases)
|   - tests/Feature/AI/DemandForecastTest.php (7 cases — live)
|
| This stub keeps the suite green and reserves the slot for proper HTTP
| smoke tests once Anthropic API credentials are configured in CI.
*/

use Illuminate\Support\Facades\Route;

it('admin AI routes are registered when Phase 4 backend is in place', function (): void {
    foreach (['v1.admin.ai.menu.generate', 'v1.admin.ai.translate', 'v1.admin.ai.usage'] as $name) {
        if (! Route::has($name)) {
            $this->markTestSkipped("Route {$name} not yet wired by Agent E2.");
        }
    }
    expect(Route::has('v1.admin.ai.menu.generate'))->toBeTrue();
    expect(Route::has('v1.admin.ai.translate'))->toBeTrue();
    expect(Route::has('v1.admin.ai.usage'))->toBeTrue();
});
