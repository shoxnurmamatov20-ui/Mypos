<?php

declare(strict_types=1);

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Tenant\Models\Tenant;

it('rejects an unauthenticated heartbeat', function (): void {
    $this->postJson('/api/v1/kiosk/heartbeat', [])
        ->assertStatus(401);
});

it('rejects an invalid bearer token', function (): void {
    $this->withHeader('Authorization', 'Bearer not-a-real-token')
        ->postJson('/api/v1/kiosk/heartbeat', [])
        ->assertStatus(401);
});

it('updates last_seen_at on a successful heartbeat', function (): void {
    $tenant = Tenant::factory()->create();
    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    /** @var KioskDevice $device */
    $device = $paired['device'];
    $oldSeen = $device->last_seen_at;

    $this->travelTo(now()->addMinutes(5));

    $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->postJson('/api/v1/kiosk/heartbeat', [
            'app_version' => '0.2.0',
            'battery_percent' => 84,
        ])
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['server_time', 'idle_timeout_seconds'],
        ]);

    $fresh = KioskDevice::query()->withoutGlobalScopes()->find($device->id);
    expect($fresh->last_seen_at->greaterThan($oldSeen))->toBeTrue();
    expect($fresh->device_info['app_version'] ?? null)->toBe('0.2.0');
    expect($fresh->device_info['battery_percent'] ?? null)->toBe(84);
});
