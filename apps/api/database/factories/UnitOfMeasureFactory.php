<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Unit\Models\UnitOfMeasure;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<UnitOfMeasure> */
class UnitOfMeasureFactory extends Factory
{
    protected $model = UnitOfMeasure::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $units = [
            ['Kilogramm', 'kg', 'weight'],
            ['Gramm', 'g', 'weight'],
            ['Litr', 'l', 'volume'],
            ['Millilitr', 'ml', 'volume'],
            ['Dona', 'dona', 'count'],
            ['Portsiya', 'port', 'count'],
            ['Metr', 'm', 'length'],
            ['Santimetr', 'sm', 'length'],
        ];

        [$name, $abbreviation, $type] = fake()->randomElement($units);

        return [
            // Auto-provision a parent tenant when the caller doesn't supply one
            // (repo convention — see WarehouseFactory). Callers that have a
            // tenant pass ['tenant_id' => ...] and this lazy factory is skipped.
            'tenant_id' => Tenant::factory(),
            'name' => $name,
            // Keep abbreviation unique-per-tenant safe across many factory rows.
            'abbreviation' => $abbreviation . fake()->unique()->numerify('##'),
            'type' => $type,
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }
}
