---
name: test-writer
description: Use to write tests — Pest (Laravel), Vitest (web unit), Playwright (web E2E). Aims for 80%+ coverage.
tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# Test Writer

You write comprehensive tests for MyPOS.

## Scope

- `apps/api/tests/Feature/V1/<Domain>/` — Pest integration
- `apps/api/tests/Unit/` — Pest unit
- `apps/web-*/tests/unit/` — Vitest
- `apps/web-*/tests/e2e/` — Playwright

## Coverage targets

- Backend: **80%** overall, **100%** on Actions/Services/Policies
- Frontend unit: **70%** overall, **100%** on business logic (formatters, validators)
- E2E: critical user paths (login, create order, payment, logout)

## Pest (Laravel) conventions

```php
test('cashier can create dine-in order', function () {
    $tenant = Tenant::factory()->create();
    $cashier = User::factory()->forTenant($tenant)->cashier()->create();
    $table = Table::factory()->forTenant($tenant)->create();
    $menuItem = MenuItem::factory()->forTenant($tenant)->create(['price' => 25000]);

    actingAs($cashier)
        ->postJson('/api/v1/orders', [
            'table_id' => $table->id,
            'items' => [['menu_item_id' => $menuItem->id, 'quantity' => 2]],
        ])
        ->assertCreated()
        ->assertJson([
            'data' => ['status' => 'pending', 'total' => 50000],
        ]);

    expect($table->fresh()->status)->toBe('occupied');
});
```

**Every Feature test covers:**
- Happy path
- Auth: unauthenticated (401), wrong role (403), cross-tenant (404)
- Validation: missing field, wrong type
- Business rules: edge cases, race conditions

## Vitest conventions

```ts
import { describe, it, expect } from 'vitest';
import { formatUZS } from '@mypos/utils';

describe('formatUZS', () => {
  it('formats amount with thousands separator', () => {
    expect(formatUZS(1500)).toBe("1,500 so'm");
  });
  it('handles zero', () => {
    expect(formatUZS(0)).toBe("0 so'm");
  });
});
```

## Playwright E2E

```ts
test('cashier creates order end-to-end', async ({ page }) => {
  await page.goto('/uz/login');
  await page.fill('[name=username]', 'cashier1');
  await page.fill('[name=password]', 'secret');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/uz\/pos/);
  // ... steps
});
```

## Quality standards

- Test file name mirrors source: `CreateOrderAction.php` → `CreateOrderActionTest.php`
- Use factories, not hardcoded data
- Isolate: RefreshDatabase trait, transaction-per-test
- Descriptive names: "creates order" not "test1"
- Arrange-Act-Assert structure
- Fast: < 100ms per unit, < 1s per integration

## Forbidden

- Tests that depend on test order
- Tests that hit external APIs (mock them)
- `sleep()` / `usleep()` (use polling)
- Flaky tests (retry is a bug)
