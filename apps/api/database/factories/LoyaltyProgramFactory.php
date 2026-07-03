<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Customer\Models\LoyaltyProgram;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<LoyaltyProgram> */
class LoyaltyProgramFactory extends Factory
{
    protected $model = LoyaltyProgram::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => [
                'uz' => 'Sodiqlik dasturi',
                'ru' => 'Программа лояльности',
                'en' => 'Loyalty program',
            ],
            'is_active' => false,
            'points_per_currency_unit' => 0.01,
            'redemption_rate_uzs' => 10,
            'tier_rules' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
