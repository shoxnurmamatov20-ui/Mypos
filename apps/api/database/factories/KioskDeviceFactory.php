<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<KioskDevice> */
class KioskDeviceFactory extends Factory
{
    protected $model = KioskDevice::class;

    public function definition(): array
    {
        $token = Str::random(64);

        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->randomElement(['Lobby iPad', 'Entrance Kiosk', 'Drive-thru Kiosk']),
            'location_label' => fake()->randomElement(['Lobby', 'Entrance', 'Drive-thru']),
            'device_token_hash' => KioskDevice::hashToken($token),
            'device_token_last4' => substr($token, -4),
            'paired_at' => now(),
            'last_seen_at' => now(),
            'last_ip_address' => fake()->ipv4(),
            'device_info' => [
                'os' => 'iPadOS 18',
                'app_version' => '0.1.0',
                'screen' => '1024x768',
            ],
            'status' => KioskDeviceStatus::Paired->value,
            'language' => 'uz',
            'theme' => 'light',
            'idle_timeout_seconds' => 60,
        ];
    }

    public function unpaired(): self
    {
        return $this->state(fn () => [
            'status' => KioskDeviceStatus::Unpaired->value,
            'device_token_hash' => null,
            'device_token_last4' => null,
            'paired_at' => null,
        ]);
    }

    public function disabled(): self
    {
        return $this->state(fn () => [
            'status' => KioskDeviceStatus::Disabled->value,
        ]);
    }

    /**
     * Returns the plaintext token alongside the model so tests can call the
     * authenticated kiosk endpoints without re-hashing.
     *
     * @return array{device: KioskDevice, token: string}
     */
    public function createWithToken(array $overrides = []): array
    {
        $token = Str::random(64);

        $device = $this->state([
            'device_token_hash' => KioskDevice::hashToken($token),
            'device_token_last4' => substr($token, -4),
            'status' => KioskDeviceStatus::Paired->value,
        ])->create($overrides);

        return ['device' => $device, 'token' => $token];
    }
}
