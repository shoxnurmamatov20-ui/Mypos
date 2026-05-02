<?php

declare(strict_types=1);

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Domain\Tenant\Models\Tenant;

it('exchanges a valid pairing code for a device token', function (): void {
    $tenant = Tenant::factory()->create();
    $pairing = KioskPairingCode::factory()->create([
        'tenant_id' => $tenant->id,
        'code' => '123456',
    ]);

    $response = $this->postJson('/api/v1/kiosk/pair', [
        'code' => '123456',
        'device_name' => 'Lobby iPad',
        'device_info' => [
            'os' => 'iPadOS 18',
            'app_version' => '0.1.0',
            'screen' => '1024x768',
        ],
    ])
        ->assertCreated()
        ->assertJsonStructure([
            'data' => [
                'device_token',
                'device' => ['id', 'name', 'status', 'device_token_last4'],
                'tenant' => ['id', 'slug', 'name', 'default_locale', 'default_currency'],
            ],
        ])
        ->assertJsonPath('data.device.status', KioskDeviceStatus::Paired->value)
        ->assertJsonPath('data.tenant.id', $tenant->id);

    expect($response->json('data.device_token'))->toHaveLength(64);

    expect(KioskDevice::query()->withoutGlobalScopes()->where('tenant_id', $tenant->id)->count())->toBe(1);
    expect(KioskPairingCode::query()->withoutGlobalScopes()->find($pairing->id)->consumed_at)->not->toBeNull();
});

it('rejects an invalid pairing code', function (): void {
    $this->postJson('/api/v1/kiosk/pair', [
        'code' => '999999',
        'device_name' => 'Lobby iPad',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['code']);
});

it('rejects an expired pairing code', function (): void {
    $tenant = Tenant::factory()->create();
    KioskPairingCode::factory()->expired()->create([
        'tenant_id' => $tenant->id,
        'code' => '111111',
    ]);

    $this->postJson('/api/v1/kiosk/pair', [
        'code' => '111111',
        'device_name' => 'Lobby iPad',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['code']);
});

it('rejects a consumed pairing code', function (): void {
    $tenant = Tenant::factory()->create();
    KioskPairingCode::factory()->consumed()->create([
        'tenant_id' => $tenant->id,
        'code' => '222222',
    ]);

    $this->postJson('/api/v1/kiosk/pair', [
        'code' => '222222',
        'device_name' => 'Lobby iPad',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['code']);
});

it('validates code shape (must be 6 digits)', function (): void {
    $this->postJson('/api/v1/kiosk/pair', [
        'code' => 'abc123',
        'device_name' => 'Lobby iPad',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['code']);
});

it('requires a device_name', function (): void {
    $this->postJson('/api/v1/kiosk/pair', [
        'code' => '123456',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['device_name']);
});
