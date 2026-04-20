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

    Role::findOrCreate('owner', 'sanctum');
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

    Role::findOrCreate('super_admin', 'sanctum');
    $user->assignRole('super_admin');

    return $user;
}
