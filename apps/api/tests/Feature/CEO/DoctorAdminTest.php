<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as MyposRole;
use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * CEO doctor administration (/api/v1/ceo/doctors*) + the clinic departments
 * dropdown source (/api/v1/ceo/clinics/{id}/departments).
 */
function makeCeoForDoctors(): User
{
    SpatieRole::findOrCreate(MyposRole::Ceo->value, 'web');

    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => false,
    ]);
    $user->assignRole(MyposRole::Ceo->value);
    $user->ownedTenants()->attach(Tenant::factory()->create()->id, [
        'id' => (string) Str::uuid(),
        'is_primary' => true,
        'joined_at' => now(),
    ]);

    return $user;
}

function makeClinicWithDepartment(): array
{
    $clinic = Clinic::query()->create([
        'name' => 'Test Klinika',
        'slug' => 'test-klinika-'.random_int(1, 99999),
        'is_active' => true,
    ]);
    $dep = ClinicDepartment::query()->create([
        'clinic_id' => $clinic->id,
        'name' => 'Pediatriya',
        'is_active' => true,
    ]);

    return [$clinic, $dep];
}

it('lists doctors with summary and pagination meta', function (): void {
    $ceo = makeCeoForDoctors();
    [$clinic, $dep] = makeClinicWithDepartment();

    ClinicDoctor::query()->create([
        'clinic_id' => $clinic->id, 'department_id' => $dep->id,
        'name' => 'Dr. Aziza', 'specialty' => 'Pediatr', 'is_active' => true,
    ]);
    ClinicDoctor::query()->create([
        'clinic_id' => $clinic->id,
        'name' => 'Dr. Bekzod', 'specialty' => 'Terapevt', 'is_active' => false,
    ]);

    $res = $this->actingAs($ceo)->getJson('/api/v1/ceo/doctors');

    $res->assertOk();
    $res->assertJsonCount(2, 'data');
    $res->assertJsonPath('summary.total', 2);
    $res->assertJsonPath('summary.active', 1);
    $res->assertJsonPath('summary.inactive', 1);
    $res->assertJsonPath('meta.page', 1);
});

it('filters doctors by search and active flag', function (): void {
    $ceo = makeCeoForDoctors();
    [$clinic] = makeClinicWithDepartment();

    ClinicDoctor::query()->create(['clinic_id' => $clinic->id, 'name' => 'Dr. Aziza', 'specialty' => 'Pediatr', 'is_active' => true]);
    ClinicDoctor::query()->create(['clinic_id' => $clinic->id, 'name' => 'Dr. Bekzod', 'specialty' => 'Terapevt', 'is_active' => false]);

    $this->actingAs($ceo)->getJson('/api/v1/ceo/doctors?q=aziza')
        ->assertOk()->assertJsonCount(1, 'data');

    $this->actingAs($ceo)->getJson('/api/v1/ceo/doctors?is_active=0')
        ->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Dr. Bekzod');
});

it('creates, updates and deletes a doctor', function (): void {
    $ceo = makeCeoForDoctors();
    [$clinic, $dep] = makeClinicWithDepartment();

    $created = $this->actingAs($ceo)->postJson('/api/v1/ceo/doctors', [
        'clinic_id' => $clinic->id,
        'department_id' => $dep->id,
        'name' => 'Dr. Nodira',
        'specialty' => 'Kardiolog',
    ]);
    $created->assertCreated();
    $id = $created->json('data.id');

    $this->actingAs($ceo)->patchJson("/api/v1/ceo/doctors/{$id}", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    $this->actingAs($ceo)->deleteJson("/api/v1/ceo/doctors/{$id}")
        ->assertOk()
        ->assertJsonPath('data.deleted', true);

    expect(ClinicDoctor::query()->find($id))->toBeNull();
});

it('rejects a department that belongs to another clinic (422)', function (): void {
    $ceo = makeCeoForDoctors();
    [$clinicA] = makeClinicWithDepartment();
    [, $depB] = makeClinicWithDepartment();

    $this->actingAs($ceo)->postJson('/api/v1/ceo/doctors', [
        'clinic_id' => $clinicA->id,
        'department_id' => $depB->id,
        'name' => 'Dr. Chet',
    ])->assertStatus(422)->assertJsonValidationErrors(['department_id']);
});

it('lists clinic departments with doctor counts', function (): void {
    $ceo = makeCeoForDoctors();
    [$clinic, $dep] = makeClinicWithDepartment();
    ClinicDoctor::query()->create(['clinic_id' => $clinic->id, 'department_id' => $dep->id, 'name' => 'Dr. X', 'is_active' => true]);

    $res = $this->actingAs($ceo)->getJson("/api/v1/ceo/clinics/{$clinic->id}/departments");

    $res->assertOk();
    $res->assertJsonCount(1, 'data');
    $res->assertJsonPath('data.0.name', 'Pediatriya');
    $res->assertJsonPath('data.0.doctors_count', 1);
});

it('denies non-CEO users', function (): void {
    SpatieRole::findOrCreate(MyposRole::Waiter->value, 'web');
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $user->assignRole(MyposRole::Waiter->value);

    $this->actingAs($user)->getJson('/api/v1/ceo/doctors')->assertStatus(403);
});
