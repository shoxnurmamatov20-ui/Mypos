<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Domain\Clinic\Models\ClinicFeedback;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

function makeCeoUserForShow(): User
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

it('returns 404 for a clinic that does not exist', function (): void {
    $ceo = makeCeoUserForShow();
    Sanctum::actingAs($ceo);

    $this->getJson('/api/v1/ceo/clinics/999999')->assertStatus(404);
});

it('returns a clinic with departments, doctors, and feedback', function (): void {
    $ceo = makeCeoUserForShow();
    Sanctum::actingAs($ceo);

    $clinic = Clinic::query()->create([
        'name' => 'Detail Klinika',
        'slug' => 'detail-klinika',
        'address' => 'Toshkent',
        'phone' => '+998711234567',
        'region' => 'Toshkent',
        'is_active' => true,
    ]);

    $dept = ClinicDepartment::query()->create([
        'clinic_id' => $clinic->id,
        'name' => 'Pediatriya',
        'is_active' => true,
    ]);

    $doctor = ClinicDoctor::query()->create([
        'clinic_id' => $clinic->id,
        'department_id' => $dept->id,
        'name' => 'Dr. Nodira',
        'specialty' => 'Pediatr',
        'is_active' => true,
    ]);

    ClinicFeedback::query()->create([
        'clinic_id' => $clinic->id,
        'department_id' => $dept->id,
        'doctor_id' => $doctor->id,
        'rating' => 5,
        'is_verified' => true,
        'sentiment' => 'positive',
        'comment_redacted' => 'A\'lo xizmat',
        'submitted_at' => now(),
    ]);

    $response = $this->getJson("/api/v1/ceo/clinics/{$clinic->id}")->assertOk();

    expect($response->json('data.id'))->toBe($clinic->id)
        ->and($response->json('data.name'))->toBe('Detail Klinika')
        ->and($response->json('data.stats.departments_count'))->toBe(1)
        ->and($response->json('data.stats.doctors_count'))->toBe(1)
        ->and($response->json('data.stats.feedback_total'))->toBe(1)
        ->and($response->json('data.stats.verified_count'))->toBe(1)
        // toEqual (==): json_encode drops the zero fraction (5.0 → "5")
        // without JSON_PRESERVE_ZERO_FRACTION, so the decoded value is int 5.
        ->and($response->json('data.stats.avg_rating'))->toEqual(5.0)
        ->and($response->json('data.departments'))->toBeArray()->toHaveCount(1)
        ->and($response->json('data.departments.0.name'))->toBe('Pediatriya')
        ->and($response->json('data.departments.0.doctors_count'))->toBe(1)
        ->and($response->json('data.doctors'))->toBeArray()->toHaveCount(1)
        ->and($response->json('data.doctors.0.name'))->toBe('Dr. Nodira')
        ->and($response->json('data.doctors.0.department.name'))->toBe('Pediatriya')
        ->and($response->json('data.recent_feedback'))->toBeArray()->toHaveCount(1)
        ->and($response->json('data.recent_feedback.0.rating'))->toBe(5)
        ->and($response->json('data.recent_feedback.0.is_verified'))->toBeTrue();
});
