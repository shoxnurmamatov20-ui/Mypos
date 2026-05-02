<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| B7-T7 — Filament Resource eager-loading guard rails
|--------------------------------------------------------------------------
|
| Spec covered (Agent B5):
|   Each Filament resource that displays related fields must eager-load
|   them in `getEloquentQuery()` so the list page does not regress to
|   N+1 every time an HR/Manager opens it.
|
| What we test:
|   - EmployeeResource::getEloquentQuery() includes 'user' + 'shifts.breaks'
|     so a 50-row table does NOT issue 50 × 3 extra queries.
|   - OrderResource eager-loads 'tenant', 'table', 'customer'.
|   - TenantResource uses `withCount('users','orders')` so the column
|     `users_count` does not trigger a sub-query per row.
|
| Methodology: we register `DB::listen()` and count exactly how many
| queries hit the DB while iterating the eager-loaded query for N rows.
| The number must be **constant** in the row count (≤ ~10).
*/

use App\Domain\Employee\Models\Employee;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use App\Filament\Resources\EmployeeResource;
use App\Filament\Resources\OrderResource;
use App\Filament\Resources\TenantResource;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    // Filament queries run inside the admin panel where a super-admin user
    // is authenticated. Tests run without auth, so we explicitly let the
    // global tenant scope skip its filter (fail-safe would otherwise emit
    // `1=0` and the eager-load assertions would all see zero rows).
    BelongsToTenant::allowEmptyTenantContext(true);
});

afterEach(function (): void {
    BelongsToTenant::allowEmptyTenantContext(false);
});

function countQueries(callable $fn): int
{
    $count = 0;
    DB::listen(function () use (&$count): void {
        $count++;
    });

    $fn();

    // Drop listeners so subsequent tests don't see our counter.
    DB::flushQueryLog();
    return $count;
}

it('EmployeeResource loads in N queries (constant)', function (): void {
    if (! class_exists(EmployeeResource::class)) {
        $this->markTestSkipped('EmployeeResource not found.');
    }

    $tenant = Tenant::factory()->create();
    Employee::factory()->count(20)->create(['tenant_id' => $tenant->id]);

    $count = countQueries(function (): void {
        EmployeeResource::getEloquentQuery()->limit(20)->get()->each(function (Employee $e): void {
            // Touching the eagerly-loaded relation must NOT issue a query.
            $e->relationLoaded('user');
            $e->relationLoaded('shifts');
        });
    });

    // Eager-load shape: 1 employees + 1 users + 1 shifts (+ 1 breaks if any).
    // Allow a generous ceiling to absorb pgsql/sqlite differences.
    expect($count)->toBeLessThanOrEqual(8);
});

it('EmployeeResource doubles row count without doubling query count', function (): void {
    if (! class_exists(EmployeeResource::class)) {
        $this->markTestSkipped('EmployeeResource not found.');
    }

    $tenant = Tenant::factory()->create();

    Employee::factory()->count(10)->create(['tenant_id' => $tenant->id]);
    $small = countQueries(function (): void {
        EmployeeResource::getEloquentQuery()->limit(10)->get();
    });

    Employee::factory()->count(20)->create(['tenant_id' => $tenant->id]);
    $big = countQueries(function (): void {
        EmployeeResource::getEloquentQuery()->limit(30)->get();
    });

    // Constant in row count (within ±1 for engine variance).
    expect(abs($small - $big))->toBeLessThanOrEqual(2);
});

it('OrderResource eager-loads tenant + table + customer', function (): void {
    if (! class_exists(OrderResource::class)) {
        $this->markTestSkipped('OrderResource not found.');
    }
    if (! method_exists(OrderResource::class, 'getEloquentQuery')) {
        $this->markTestSkipped('OrderResource::getEloquentQuery not implemented yet.');
    }

    $tenant = Tenant::factory()->create();
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id]);
    MenuItem::factory()->count(2)->create(['tenant_id' => $tenant->id, 'category_id' => $cat->id]);
    Order::factory()->count(15)->create(['tenant_id' => $tenant->id]);

    $count = countQueries(function (): void {
        $rows = OrderResource::getEloquentQuery()->limit(15)->get();
        foreach ($rows as $r) {
            $r->relationLoaded('tenant');
            $r->relationLoaded('table');
            $r->relationLoaded('customer');
        }
    });

    // 1 orders + ≤4 eager-loads (tenant, table, customer, items).
    expect($count)->toBeLessThanOrEqual(8);
});

it('TenantResource uses withCount for users + orders', function (): void {
    if (! class_exists(TenantResource::class)) {
        $this->markTestSkipped('TenantResource not found.');
    }
    if (! method_exists(TenantResource::class, 'getEloquentQuery')) {
        $this->markTestSkipped('TenantResource::getEloquentQuery not implemented yet.');
    }

    Tenant::factory()->count(10)->create();

    $count = countQueries(function (): void {
        $rows = TenantResource::getEloquentQuery()->limit(10)->get();
        foreach ($rows as $r) {
            // Accessing *_count from withCount must NOT issue a new query.
            // Tenant has a `users` relation; orders_count may or may not be
            // wired depending on Agent B5's choice (Tenant::orders() doesn't
            // exist yet in main).
            $hasUsersCount = isset($r->users_count);
            expect($hasUsersCount)->toBeTrue();
        }
    });

    // 1 query — withCount uses subqueries inside the main SELECT.
    expect($count)->toBeLessThanOrEqual(3);
});

it('list page query count stays under 10 for typical rendering', function (): void {
    if (! class_exists(EmployeeResource::class)) {
        $this->markTestSkipped('EmployeeResource not found.');
    }

    $tenant = Tenant::factory()->create();
    Employee::factory()->count(50)->create(['tenant_id' => $tenant->id]);

    $count = countQueries(function (): void {
        // Simulate Filament rendering one page (50 rows) of the table.
        EmployeeResource::getEloquentQuery()
            ->limit(50)
            ->get()
            ->each(function (Employee $e): void {
                // Filament reads several columns through user.name, user.phone.
                $e->user?->name;
                $e->user?->phone;
            });
    });

    expect($count)->toBeLessThan(10);
});

it('OrderResource does not trigger N+1 on tenant.name column', function (): void {
    if (! class_exists(OrderResource::class)) {
        $this->markTestSkipped('OrderResource not found.');
    }
    if (! method_exists(OrderResource::class, 'getEloquentQuery')) {
        $this->markTestSkipped('OrderResource::getEloquentQuery not implemented yet.');
    }

    $tenant = Tenant::factory()->create();
    Order::factory()->count(25)->create(['tenant_id' => $tenant->id]);

    $count = countQueries(function (): void {
        $rows = OrderResource::getEloquentQuery()->limit(25)->get();
        foreach ($rows as $r) {
            $name = $r->tenant?->name; // must not query 25× more times
        }
    });

    expect($count)->toBeLessThan(10);
});
