<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    Cache::forget('platform_settings');
});

it('returns default platform settings', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/settings')->assertOk();

    expect($response->json('data.default_locale'))->toBe('uz');
    expect($response->json('data.default_currency'))->toBe('UZS');
    expect($response->json('data.feature_flags.kiosk'))->toBeTrue();
});

it('updates platform settings via PATCH', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->patchJson('/api/v1/super-admin/settings', [
        'settings' => [
            'maintenance_mode' => true,
            'default_trial_days' => 30,
        ],
    ])->assertOk();

    expect($response->json('data.maintenance_mode'))->toBeTrue();
    expect($response->json('data.default_trial_days'))->toBe(30);

    // Defaults that were not overwritten remain
    expect($response->json('data.default_currency'))->toBe('UZS');
});
