<?php

declare(strict_types=1);

use App\Domain\SuperAdmin\Models\AuditLog;
use App\Domain\SuperAdmin\Services\AuditLogger;
use Laravel\Sanctum\Sanctum;

it('lists audit logs ordered by created_at desc', function (): void {
    AuditLogger::log('test.event_a', ['severity' => 'info']);
    AuditLogger::log('test.event_b', ['severity' => 'warning']);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/audit-logs')->assertOk();

    expect(count($response->json('data')))->toBeGreaterThanOrEqual(2);
    $first = $response->json('data.0.action');
    $second = $response->json('data.1.action');
    expect([$first, $second])->toContain('test.event_b');
});

it('filters audit logs by action', function (): void {
    AuditLogger::log('only.this_action', []);
    AuditLogger::log('not.this_action', []);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/audit-logs?action=only.this_action&per_page=50')
        ->assertOk();

    foreach ($response->json('data') as $row) {
        expect($row['action'])->toBe('only.this_action');
    }
});

it('filters audit logs by severity', function (): void {
    AuditLogger::log('test.warn_evt', ['severity' => 'warning']);
    AuditLogger::log('test.info_evt', ['severity' => 'info']);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/audit-logs?severity=warning&per_page=50')
        ->assertOk();

    foreach ($response->json('data') as $row) {
        expect($row['severity'])->toBe('warning');
    }
});

it('returns distinct actions list', function (): void {
    AuditLog::insert([
        ['id' => (string) \Illuminate\Support\Str::uuid(), 'action' => 'a.x', 'actor_type' => 'system', 'severity' => 'info', 'created_at' => now()],
        ['id' => (string) \Illuminate\Support\Str::uuid(), 'action' => 'b.y', 'actor_type' => 'system', 'severity' => 'info', 'created_at' => now()],
        ['id' => (string) \Illuminate\Support\Str::uuid(), 'action' => 'a.x', 'actor_type' => 'system', 'severity' => 'info', 'created_at' => now()],
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/audit-logs/actions')->assertOk();

    $actions = $response->json('data');
    expect($actions)->toContain('a.x');
    expect($actions)->toContain('b.y');
    expect(count(array_keys(array_count_values($actions))))->toBe(count($actions));
});
