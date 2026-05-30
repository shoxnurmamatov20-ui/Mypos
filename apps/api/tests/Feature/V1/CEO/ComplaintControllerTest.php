<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicComplaint;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;

/**
 * Provisions a CEO user that owns one tenant — the EnsureCEO middleware
 * requires both the `ceo` role and ≥1 row in `tenant_owners`.
 */
function actingAsCeoForComplaints(): User
{
    $tenant = Tenant::factory()->create();

    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => false,
    ]);

    Role::findOrCreate(RoleEnum::Ceo->value, 'web');
    $user->assignRole(RoleEnum::Ceo->value);

    // Insert directly — the uuid PK on tenant_owners has no DB default, so
    // ->attach() would push a NULL `id`. Generate one explicitly.
    \DB::table('tenant_owners')->insert([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'is_primary' => true,
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $user;
}

function seedComplaintFixtures(): array
{
    $clinic = Clinic::query()->create([
        'name' => 'Test klinika',
        'slug' => 'test-klinika-' . uniqid(),
        'region' => 'Toshkent',
        'address' => 'Test address',
        'phone' => '+998901234567',
        'is_active' => true,
    ]);

    $openLow = ClinicComplaint::query()->create([
        'clinic_id' => $clinic->id,
        'severity' => 'low',
        'status' => 'open',
        'is_urgent' => false,
        'summary' => 'Test low-severity complaint',
    ]);

    $openUrgent = ClinicComplaint::query()->create([
        'clinic_id' => $clinic->id,
        'severity' => 'urgent',
        'status' => 'open',
        'is_urgent' => true,
        'summary' => 'Test urgent complaint',
    ]);

    $resolved = ClinicComplaint::query()->create([
        'clinic_id' => $clinic->id,
        'severity' => 'high',
        'status' => 'resolved',
        'is_urgent' => false,
        'summary' => 'Test resolved complaint',
        'resolved_at' => now()->subHours(2),
    ]);
    // Backdate via raw query — Eloquent overwrites `created_at` on save().
    \DB::table('clinic_complaints')->where('id', $resolved->id)->update([
        'created_at' => now()->subHours(10),
        'updated_at' => now()->subHours(2),
    ]);

    // Stale row — open, created > 72h ago
    $stale = ClinicComplaint::query()->create([
        'clinic_id' => $clinic->id,
        'severity' => 'medium',
        'status' => 'open',
        'is_urgent' => false,
        'summary' => 'Old stale complaint',
    ]);
    \DB::table('clinic_complaints')->where('id', $stale->id)->update([
        'created_at' => now()->subHours(80),
        'updated_at' => now()->subHours(80),
    ]);

    return compact('clinic', 'openLow', 'openUrgent', 'resolved', 'stale');
}

it('rejects anonymous requests on /api/v1/ceo/complaints', function (): void {
    $this->getJson('/api/v1/ceo/complaints')->assertStatus(401);
});

it('rejects non-CEO authenticated users', function (): void {
    $owner = actingAsTenantOwner();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/ceo/complaints')
        ->assertStatus(403);
});

it('returns paginated complaints with summary for CEO', function (): void {
    $user = actingAsCeoForComplaints();
    seedComplaintFixtures();

    $res = $this->actingAs($user, 'sanctum')->getJson('/api/v1/ceo/complaints');

    $res->assertOk()
        ->assertJsonStructure([
            'data' => [['id', 'severity', 'status', 'is_urgent', 'summary', 'clinic']],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            'summary' => [
                'total', 'open', 'in_review', 'resolved', 'escalated',
                'urgent', 'stale', 'avg_resolution_hours',
            ],
            'filters' => ['statuses', 'severities', 'stale_hours'],
        ]);

    expect($res->json('summary.total'))->toBe(4)
        ->and($res->json('summary.open'))->toBe(3)
        ->and($res->json('summary.resolved'))->toBe(1)
        ->and($res->json('summary.urgent'))->toBe(1)
        ->and($res->json('summary.stale'))->toBe(1)
        ->and($res->json('filters.stale_hours'))->toBe(ClinicComplaint::STALE_HOURS);
});

it('filters by status', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();

    $res = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/ceo/complaints?status=resolved');

    $res->assertOk();
    expect($res->json('meta.total'))->toBe(1)
        ->and($res->json('data.0.id'))->toBe($fx['resolved']->id);
});

it('filters urgent + stale flags independently', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();

    $urgent = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/ceo/complaints?urgent=1')->json();
    expect($urgent['meta']['total'])->toBe(1)
        ->and($urgent['data'][0]['id'])->toBe($fx['openUrgent']->id);

    $stale = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/ceo/complaints?stale=1')->json();
    expect($stale['meta']['total'])->toBe(1)
        ->and($stale['data'][0]['id'])->toBe($fx['stale']->id);
});

it('rejects invalid severity', function (): void {
    $user = actingAsCeoForComplaints();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/ceo/complaints?severity=bogus')
        ->assertStatus(422);
});

it('updates status and stamps resolved_at on resolve', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();
    $id = $fx['openLow']->id;

    $res = $this->actingAs($user, 'sanctum')->patchJson("/api/v1/ceo/complaints/{$id}", [
        'status' => 'resolved',
        'resolution_note' => 'Spoke to patient, refund issued',
    ]);

    $res->assertOk()
        ->assertJsonPath('data.status', 'resolved')
        ->assertJsonPath('data.id', $id);

    $row = ClinicComplaint::query()->find($id);
    expect($row->status)->toBe('resolved')
        ->and($row->resolved_at)->not->toBeNull()
        ->and($row->summary)->toContain('[Resolution:');
});

it('reopen clears resolved_at', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();
    $id = $fx['resolved']->id;

    $this->actingAs($user, 'sanctum')->patchJson("/api/v1/ceo/complaints/{$id}", [
        'status' => 'open',
    ])->assertOk();

    expect(ClinicComplaint::query()->find($id)->resolved_at)->toBeNull();
});

it('bulk marks selected rows as urgent', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();
    $ids = [$fx['openLow']->id, $fx['stale']->id];

    $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/ceo/complaints/bulk', [
        'action' => 'mark_urgent',
        'ids' => $ids,
    ]);

    $res->assertOk()->assertJsonPath('data.touched', 2);

    foreach ($ids as $id) {
        expect(ClinicComplaint::query()->find($id)->is_urgent)->toBeTrue();
    }
});

it('bulk set_status requires a valid status', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();

    $this->actingAs($user, 'sanctum')->postJson('/api/v1/ceo/complaints/bulk', [
        'action' => 'set_status',
        'ids' => [$fx['openLow']->id],
        // missing `status`
    ])->assertStatus(422);
});

it('bulk delete removes rows', function (): void {
    $user = actingAsCeoForComplaints();
    $fx = seedComplaintFixtures();

    $this->actingAs($user, 'sanctum')->postJson('/api/v1/ceo/complaints/bulk', [
        'action' => 'delete',
        'ids' => [$fx['openLow']->id, $fx['openUrgent']->id],
    ])->assertOk();

    expect(ClinicComplaint::query()->whereIn('id', [
        $fx['openLow']->id,
        $fx['openUrgent']->id,
    ])->count())->toBe(0);
});

it('returns distinct regions from clinics', function (): void {
    $user = actingAsCeoForComplaints();
    Clinic::query()->create([
        'name' => 'A', 'slug' => 'a-' . uniqid(),
        'region' => 'Buxoro', 'is_active' => true,
    ]);
    Clinic::query()->create([
        'name' => 'B', 'slug' => 'b-' . uniqid(),
        'region' => 'Toshkent', 'is_active' => true,
    ]);

    $res = $this->actingAs($user, 'sanctum')->getJson('/api/v1/ceo/complaints/regions');

    $res->assertOk();
    $regions = $res->json('data');
    expect($regions)->toContain('Toshkent')->toContain('Buxoro');
});
