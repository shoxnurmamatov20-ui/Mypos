<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Tenant> */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = fake()->randomElement(['Osh Markazi', 'Plov Club', "Kafe Do'stlik", 'Chaykhana Oltin']);

        return [
            'slug' => Str::slug($name) . '-' . Str::random(5),
            'name' => $name,
            'legal_name' => $name . ' MCHJ',
            'plan' => 'free',
            'status' => 'active',
            'default_locale' => 'uz',
            'default_currency' => 'UZS',
            'timezone' => 'Asia/Tashkent',
            'phone' => '+998' . fake()->numerify('#########'),
            'email' => fake()->unique()->safeEmail(),
        ];
    }
}
