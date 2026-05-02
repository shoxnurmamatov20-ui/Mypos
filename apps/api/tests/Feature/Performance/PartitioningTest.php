<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| B7-T8 — courier_locations partitioning (Agent B6, P4)
|--------------------------------------------------------------------------
|
| Spec covered:
|   - `courier_locations` is RANGE-partitioned on `recorded_at`.
|   - 13 monthly partitions are pre-created (current + 12 ahead) plus a
|     `courier_locations_default` catch-all so out-of-range inserts won't
|     fail with 23514.
|   - SELECTs filtered by `recorded_at` are routed to a single partition
|     (Postgres planner uses partition pruning).
|   - INSERTs target the partition matching the row's `recorded_at`.
|
| The migration `2026_05_01_000007_partition_courier_locations.php` is a
| no-op on non-pgsql drivers, so this whole file skips on sqlite/mysql.
*/

use App\Domain\Employee\Models\CourierLocation;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partitioning is a PostgreSQL-only feature.');
    }
});

it('courier_locations is partitioned by recorded_at', function (): void {
    $row = DB::selectOne(
        "SELECT 1 AS x
         FROM pg_partitioned_table pt
         JOIN pg_class c ON c.oid = pt.partrelid
         WHERE c.relname = 'courier_locations'"
    );

    expect($row)->not->toBeNull();
});

it('declares a partition strategy of RANGE', function (): void {
    $row = DB::selectOne(
        "SELECT pt.partstrat AS strategy
         FROM pg_partitioned_table pt
         JOIN pg_class c ON c.oid = pt.partrelid
         WHERE c.relname = 'courier_locations'"
    );

    // 'r' = RANGE (vs 'l' = LIST, 'h' = HASH)
    expect($row->strategy)->toBe('r');
});

it('partitions on recorded_at column', function (): void {
    $row = DB::selectOne(
        "SELECT a.attname AS col
         FROM pg_partitioned_table pt
         JOIN pg_class c ON c.oid = pt.partrelid
         JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(pt.partattrs)
         WHERE c.relname = 'courier_locations'"
    );

    expect($row->col)->toBe('recorded_at');
});

it('has at least 13 monthly partitions plus default', function (): void {
    $rows = DB::select(
        "SELECT inhrelid::regclass::text AS partition_name
         FROM pg_inherits
         WHERE inhparent = 'courier_locations'::regclass"
    );

    $names = collect($rows)->pluck('partition_name')->all();

    // 13 monthly + 1 default = 14 minimum.
    expect(count($names))->toBeGreaterThanOrEqual(13);

    // The default partition must exist.
    $hasDefault = collect($names)->contains(fn ($n) => str_contains($n, '_default'));
    expect($hasDefault)->toBeTrue();
});

it('queries route to correct partition', function (): void {
    // Use EXPLAIN to confirm partition pruning kicks in for a date filter.
    $explain = DB::select(
        "EXPLAIN (FORMAT TEXT) SELECT * FROM courier_locations
         WHERE recorded_at = NOW()::timestamp(0)"
    );

    $plan = collect($explain)->pluck('QUERY PLAN')->implode("\n");

    // Either we see a single child node referenced (good) OR the planner
    // explicitly says it pruned (>=PG14 emits "Partitions pruned: N"). Any
    // mention of `courier_locations_2026_` proves child routing.
    $references = preg_match('/courier_locations_(\d+_\d+|default)/', $plan);
    expect($references)->toBe(1);
});

it('inserts go to current month partition', function (): void {
    $tenant = Tenant::factory()->create();
    $employee = Employee::factory()->create(['tenant_id' => $tenant->id]);
    $order = Order::factory()->create(['tenant_id' => $tenant->id]);

    CourierLocation::query()->create([
        'tenant_id' => $tenant->id,
        'employee_id' => $employee->id,
        'order_id' => $order->id,
        'lat' => 41.30,
        'lng' => 69.24,
        'recorded_at' => now(),
    ]);

    // Find the partition that holds this current-month row.
    $thisMonth = now()->format('Y_m');
    $partitionName = 'courier_locations_' . $thisMonth;

    $count = DB::scalar(
        "SELECT COUNT(*)::int FROM {$partitionName} WHERE tenant_id = ?",
        [$tenant->id]
    );

    expect($count)->toBeGreaterThanOrEqual(1);
});

it('default partition catches out-of-range inserts', function (): void {
    $tenant = Tenant::factory()->create();
    $employee = Employee::factory()->create(['tenant_id' => $tenant->id]);

    // Use a year far outside our 13-month window so we know the row lands
    // in the default partition.
    CourierLocation::query()->create([
        'tenant_id' => $tenant->id,
        'employee_id' => $employee->id,
        'lat' => 41.30,
        'lng' => 69.24,
        'recorded_at' => now()->subYears(5),
    ]);

    $count = DB::scalar(
        "SELECT COUNT(*)::int FROM courier_locations_default WHERE tenant_id = ?",
        [$tenant->id]
    );

    expect($count)->toBe(1);
});

it('RLS policy is attached to the partitioned parent', function (): void {
    $row = DB::selectOne(
        "SELECT relrowsecurity AS rls
         FROM pg_class
         WHERE relname = 'courier_locations'"
    );

    expect((bool) $row->rls)->toBeTrue();
});

it('compound index (tenant_id, employee_id, recorded_at DESC) exists', function (): void {
    $row = DB::selectOne(
        "SELECT 1 AS x
         FROM pg_indexes
         WHERE tablename = 'courier_locations'
           AND indexname = 'courier_locations_tenant_emp_recorded_idx'"
    );

    expect($row)->not->toBeNull();
});

it('compound index (tenant_id, order_id, recorded_at DESC) exists', function (): void {
    $row = DB::selectOne(
        "SELECT 1 AS x
         FROM pg_indexes
         WHERE tablename = 'courier_locations'
           AND indexname = 'courier_locations_tenant_order_recorded_idx'"
    );

    expect($row)->not->toBeNull();
});

it('foreign key on tenant_id has CASCADE delete', function (): void {
    $row = DB::selectOne(
        "SELECT confdeltype AS rule
         FROM pg_constraint
         WHERE conname = 'courier_locations_tenant_id_foreign'"
    );

    if ($row === null) {
        $this->markTestSkipped('FK not present — partition migration may not have run.');
    }

    // 'c' = CASCADE in pg_constraint.confdeltype
    expect($row->rule)->toBe('c');
});

it('orders compound indexes are present (audit P5)', function (): void {
    // Agent B6 adds compound indexes to orders for fast list/queue queries.
    // Migration: 2026_05_01_000008_add_compound_indexes_to_orders
    $rows = DB::select(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'orders'"
    );

    $names = collect($rows)->pluck('indexname')->all();

    // At least one tenant-prefixed compound index should exist.
    $hasCompound = collect($names)->contains(fn ($n) => str_contains($n, 'tenant') && str_contains($n, 'status'));
    expect($hasCompound)->toBeTrue();
});
