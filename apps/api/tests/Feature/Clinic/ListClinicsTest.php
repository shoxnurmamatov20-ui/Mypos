<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicComplaint;
use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Domain\Clinic\Models\ClinicFeedback;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

/**
 * @return User
 */
function makeCeoUser(): User
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => false,
    ]);
    Role::findOrCreate(RoleEnum::Ceo->value, 'web');
    $user->assignRole(RoleEnum::Ceo->value);

    DB::table('tenant_owners')->insert([
        'id' => (string) Str::uuid(),
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'is_primary' => true,
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $user->fresh();
}

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/ceo/clinics')->assertStatus(401);
});

it('lists clinics with computed stats for an authenticated CEO', function (): void {
    $ceo = makeCeoUser();
    Sanctum::actingAs($ceo);

    $clinic = Clinic::query()->create([
        'name' => 'Test Klinika',
        'slug' => 'test-klinika',
        'address' => 'Toshkent, sinov manzili',
        'phone' => '+998711112233',
        'region' => 'Toshkent',
        'is_active' => true,
    ]);

    $dept = ClinicDepartment::query()->create([
        'clinic_id' => $clinic->id,
        'name' => 'Kardiologiya',
        'is_active' => true,
    ]);

    $doctor = ClinicDoctor::query()->create([
        'clinic_id' => $clinic->id,
        'department_id' => $dept->id,
        'name' => 'Dr. Tester',
        'specialty' => 'Kardiolog',
        'is_active' => true,
    ]);

    // 3 verified 5-star, 1 unverified 3-star → avg = 4.5
    foreach ([5, 5, 5, 3] as $rating) {
        ClinicFeedback::query()->create([
            'clinic_id' => $clinic->id,
            'department_id' => $dept->id,
            'doctor_id' => $doctor->id,
            'rating' => $rating,
            'is_verified' => $rating === 5,
            'sentiment' => 'positive',
            'submitted_at' => now(),
        ]);
    }

    ClinicComplaint::query()->create([
        'clinic_id' => $clinic->id,
        'severity' => 'high',
        'status' => 'open',
        'is_urgent' => true,
    ]);

    $response = $this->getJson('/api/v1/ceo/clinics')->assertOk();

    expect($response->json('meta.count'))->toBeGreaterThanOrEqual(1);
    expect($response->json('data'))->toBeArray();

    $row = collect($response->json('data'))
        ->firstWhere('slug', 'test-klinika');

    expect($row)->not->toBeNull()
        ->and($row['name'])->toBe('Test Klinika')
        ->and($row['departments_count'])->toBe(1)
        ->and($row['doctors_count'])->toBe(1)
        ->and($row['feedback']['total'])->toBe(4)
        ->and($row['feedback']['verified_count'])->toBe(3)
        ->and($row['feedback']['avg_rating'])->toBe(4.5)
        ->and($row['complaints']['open'])->toBe(1)
        ->and($row['complaints']['urgent'])->toBe(1);
});
