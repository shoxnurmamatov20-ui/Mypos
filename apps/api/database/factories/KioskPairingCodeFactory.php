<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<KioskPairingCode> */
class KioskPairingCodeFactory extends Factory
{
    protected $model = KioskPairingCode::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'code' => str_pad((string) fake()->unique()->numberBetween(0, 999999), 6, '0', STR_PAD_LEFT),
            'expires_at' => now()->addMinutes(15),
            'consumed_at' => null,
            'created_by_user_uuid' => null,
        ];
    }

    public function expired(): self
    {
        return $this->state(fn () => [
            'expires_at' => now()->subMinute(),
        ]);
    }

    public function consumed(): self
    {
        return $this->state(fn () => [
            'consumed_at' => now(),
        ]);
    }
}
