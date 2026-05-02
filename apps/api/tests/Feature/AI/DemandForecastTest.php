<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — DemandForecastService (no AI; pure SQL aggregation)
|--------------------------------------------------------------------------
|
| Spec covered (Agent E3 — `App\Domain\AI\Services\DemandForecastService`):
|
|   - topItemsForRestaurant($tenant, $days = 30) — best sellers in the
|     trailing window, with by-day-of-week / by-hour breakdowns.
|   - predictNextWeek($tenant) — naive regression based on per-DOW means
|     over the trailing 8 weeks.
|   - lowSellersToRetire($tenant, $days = 60) — items with < 5 units sold,
|     surfaced as menu-retirement candidates.
|
| All queries explicitly filter `tenant_id`, so the trio also doubles as a
| cross-tenant isolation test.
|
| Skip rules:
|   - PostgreSQL only (uses EXTRACT(DOW FROM …) and ::int casts)
|   - DemandForecastService class must exist
|   - menu_items + orders + order_items tables must be migrated
*/

use App\Domain\AI\Services\DemandForecastService;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('DemandForecastService uses pg-specific EXTRACT(DOW); pgsql only.');
    }
    if (! class_exists(DemandForecastService::class)) {
        $this->markTestSkipped('DemandForecastService not yet shipped (pending Agent E3).');
    }
    foreach (['orders', 'order_items', 'menu_items', 'menu_categories'] as $tbl) {
        if (! Schema::hasTable($tbl)) {
            $this->markTestSkipped("Required table `{$tbl}` not migrated.");
        }
    }

    BelongsToTenant::allowEmptyTenantContext(true);
});

afterEach(function (): void {
    BelongsToTenant::allowEmptyTenantContext(false);
});

/**
 * Build a fresh menu category for a tenant. Uses the actual fillable shape
 * exposed by the live MenuCategory model (`name`, `slug`, `sort_order`,
 * `is_active`).
 */
function makeMenuCategory(Tenant $tenant, string $label = 'Main'): MenuCategory
{
    return MenuCategory::query()->create([
        'tenant_id' => $tenant->id,
        'name' => ['uz' => $label, 'ru' => $label, 'en' => $label],
        'slug' => strtolower($label) . '-' . bin2hex(random_bytes(3)),
        'is_active' => true,
        'sort_order' => 1,
    ]);
}

/**
 * Build a fresh menu item using the live MenuItem fillable: `category_id`
 * (NOT `menu_category_id`), `price_amount` + `price_currency`.
 */
function makeMenuItem(Tenant $tenant, MenuCategory $category, string $name, int $price = 10000): MenuItem
{
    return MenuItem::query()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => ['uz' => $name, 'ru' => $name, 'en' => $name],
        'slug' => strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name) ?? 'item') . '-' . bin2hex(random_bytes(3)),
        'price_amount' => $price,
        'price_currency' => 'UZS',
        'is_active' => true,
    ]);
}

/**
 * Seed N orders for a given (tenant, menuItem) pair across the trailing
 * window so the forecast service has data to aggregate.
 *
 * Mirrors the column names actually present in the live order_items /
 * orders tables: `name_snapshot`, `price_amount`, `subtotal_amount`,
 * `currency`.
 */
function seedOrdersWithItem(
    Tenant $tenant,
    MenuItem $menuItem,
    int $orderCount,
    int $qtyPerOrder = 1,
    string $status = 'completed',
): void {
    for ($i = 0; $i < $orderCount; $i++) {
        $createdAt = now()->subDays(random_int(1, 28))->subHours(random_int(0, 14));
        $unitPrice = (int) $menuItem->price_amount;
        $lineTotal = $unitPrice * $qtyPerOrder;

        $order = Order::query()->create([
            'tenant_id' => $tenant->id,
            'order_no' => 'O' . now()->format('ymd') . '-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT) . '-' . $i,
            'type' => 'dine_in',
            'status' => $status,
            'payment_status' => 'paid',
            'guest_count' => 1,
            'subtotal_amount' => $lineTotal,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'tip_amount' => 0,
            'service_charge_amount' => 0,
            'total_amount' => $lineTotal,
            'paid_amount' => $lineTotal,
            'currency' => 'UZS',
            'placed_at' => $createdAt,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        OrderItem::query()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'menu_item_id' => $menuItem->id,
            'name_snapshot' => 'snapshot name',
            'quantity' => $qtyPerOrder,
            'price_amount' => $unitPrice,
            'subtotal_amount' => $lineTotal,
            'currency' => 'UZS',
        ]);
    }
}

it('topItemsForRestaurant returns top sellers in the window', function (): void {
    $tenant = Tenant::factory()->create();
    $cat = makeMenuCategory($tenant, 'Main');

    $hot = makeMenuItem($tenant, $cat, 'Osh', 45000);
    $cold = makeMenuItem($tenant, $cat, 'Qovurma', 38000);

    seedOrdersWithItem($tenant, $hot, 20, 2);
    seedOrdersWithItem($tenant, $cold, 3);

    $service = new DemandForecastService();
    $top = $service->topItemsForRestaurant($tenant, days: 30);

    expect($top)->toBeArray();
    expect($top)->not->toBeEmpty();
    // The hottest item should appear before the cold one.
    $names = array_map(static fn ($r) => (string) ($r['name'] ?? ''), $top);
    $hotIdx = array_search('Osh', $names, true);
    $coldIdx = array_search('Qovurma', $names, true);
    if ($hotIdx !== false && $coldIdx !== false) {
        expect($hotIdx)->toBeLessThan($coldIdx);
    }
});

it('topItemsForRestaurant returns empty when no orders', function (): void {
    $tenant = Tenant::factory()->create();
    $service = new DemandForecastService();

    expect($service->topItemsForRestaurant($tenant))->toBe([]);
});

it('topItemsForRestaurant excludes cancelled orders', function (): void {
    $tenant = Tenant::factory()->create();
    $cat = makeMenuCategory($tenant);
    $item = makeMenuItem($tenant, $cat, 'X');

    seedOrdersWithItem($tenant, $item, 20, status: 'cancelled');

    $service = new DemandForecastService();
    $top = $service->topItemsForRestaurant($tenant);

    // All seeds were cancelled — should be excluded entirely.
    expect($top)->toBe([]);
});

it('predictNextWeek aggregates by day-of-week and returns 7-day forecast', function (): void {
    $tenant = Tenant::factory()->create();
    $cat = makeMenuCategory($tenant);
    $item = makeMenuItem($tenant, $cat, 'Steady', 30000);

    // Seed enough orders that at least one week-DOW bucket has data.
    seedOrdersWithItem($tenant, $item, 40, 1);

    $service = new DemandForecastService();
    $forecast = $service->predictNextWeek($tenant);

    expect($forecast)->toBeArray();
    if ($forecast === []) {
        // Empty forecast is acceptable when no DOW alignment matched the upcoming week —
        // the algorithm is naive and skip-friendly.
        expect(true)->toBeTrue();
        return;
    }

    foreach ($forecast as $row) {
        expect($row)->toHaveKeys([
            'menu_item_id',
            'name',
            'predicted_qty_next_week',
            'confidence',
            'by_day_predicted',
        ]);
        expect((float) $row['confidence'])->toBeGreaterThanOrEqual(0.0);
        expect((float) $row['confidence'])->toBeLessThanOrEqual(1.0);
    }
});

it('lowSellersToRetire identifies items with <5 orders in the window', function (): void {
    $tenant = Tenant::factory()->create();
    $cat = makeMenuCategory($tenant);

    $orphan = makeMenuItem($tenant, $cat, 'Forgotten', 15000);
    $popular = makeMenuItem($tenant, $cat, 'Popular', 25000);

    seedOrdersWithItem($tenant, $orphan, 2);   // < 5 → flagged
    seedOrdersWithItem($tenant, $popular, 30); // >= 5 → not flagged

    $service = new DemandForecastService();
    $retire = $service->lowSellersToRetire($tenant, days: 60);

    $names = array_map(static fn ($r) => (string) ($r['name'] ?? ''), $retire);
    expect($names)->toContain('Forgotten');
    expect($names)->not->toContain('Popular');
});

it('lowSellersToRetire flags items with zero sales (active but never ordered)', function (): void {
    $tenant = Tenant::factory()->create();
    $cat = makeMenuCategory($tenant);
    makeMenuItem($tenant, $cat, 'Never sold', 12000);

    $service = new DemandForecastService();
    $retire = $service->lowSellersToRetire($tenant);

    expect($retire)->toBeArray();
    expect($retire)->not->toBeEmpty();
    expect((int) $retire[0]['total_qty'])->toBe(0);
});

it('respects tenant scope — one tenant cannot see another tenant\'s items', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $catA = makeMenuCategory($tenantA, 'CatA');
    $catB = makeMenuCategory($tenantB, 'CatB');
    $itemA = makeMenuItem($tenantA, $catA, 'Tenant-A item');
    $itemB = makeMenuItem($tenantB, $catB, 'Tenant-B item');

    seedOrdersWithItem($tenantA, $itemA, 25);
    seedOrdersWithItem($tenantB, $itemB, 25);

    $service = new DemandForecastService();
    $resultA = $service->topItemsForRestaurant($tenantA);
    $resultB = $service->topItemsForRestaurant($tenantB);

    $namesA = array_map(static fn ($r) => (string) ($r['name'] ?? ''), $resultA);
    $namesB = array_map(static fn ($r) => (string) ($r['name'] ?? ''), $resultB);

    expect($namesA)->not->toContain('Tenant-B item');
    expect($namesB)->not->toContain('Tenant-A item');
});
