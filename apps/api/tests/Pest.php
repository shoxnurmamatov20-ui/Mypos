<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Binds Pest's TestCase for Feature tests (with DB) and Unit tests.
| See CLAUDE.md §6 — Pest is the canonical backend test runner.
|
*/

use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(Tests\TestCase::class)->in('Unit');

/*
|--------------------------------------------------------------------------
| Global helpers
|--------------------------------------------------------------------------
*/

/**
 * Create a tenant owner (acts as authenticated tenant user).
 */
function actingAsTenantOwner(?Tenant $tenant = null): User
{
    $tenant ??= Tenant::factory()->create();

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);

    Role::findOrCreate('owner', 'web');
    $user->assignRole('owner');

    return $user;
}

/**
 * Create a super admin user (no tenant).
 */
function actingAsSuperAdmin(): User
{
    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => true,
    ]);

    Role::findOrCreate('super_admin', 'web');
    $user->assignRole('super_admin');

    return $user;
}

/**
 * Create a staff (User + active Employee) for the given tenant and position.
 *
 * @return array{user: User, employee: \App\Domain\Employee\Models\Employee}
 */
function actingAsStaff(string $position = 'waiter', ?Tenant $tenant = null): array
{
    $tenant ??= Tenant::factory()->create();

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);

    // Build the model directly to avoid the EmployeeFactory closure that would
    // otherwise create a second orphan User record.
    $employee = new \App\Domain\Employee\Models\Employee([
        'tenant_id' => $tenant->id,
        'user_uuid' => $user->uuid,
        'employee_code' => 'EMP-' . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
        'position' => $position,
        'hire_date' => now()->subYear()->toDateString(),
        'hourly_rate' => 30000,
        'status' => 'active',
    ]);
    $employee->save();

    return ['user' => $user, 'employee' => $employee->fresh()];
}

/**
 * Convenience wrapper for delivery tests — same shape as actingAsStaff
 * but defaults to the courier role.
 *
 * @return array{user: User, employee: \App\Domain\Employee\Models\Employee}
 */
function actingAsCourier(?Tenant $tenant = null): array
{
    return actingAsStaff('courier', $tenant);
}
