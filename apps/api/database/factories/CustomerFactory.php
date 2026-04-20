<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Customer\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Customer> */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        $firstNames = [
            'Akmal', 'Bekzod', 'Dilshod', 'Eldor', 'Farrux', 'G\'ayrat', 'Hasan', 'Islom',
            'Jahongir', 'Kamron', 'Laziz', 'Mirzo', 'Nodir', 'Oybek', 'Pulat', 'Rustam',
            'Shoxrux', 'Temur', 'Umid', 'Vali', 'Yorqin', 'Zafar',
            'Aziza', 'Dilnoza', 'Feruza', 'Gulnora', 'Hulkar', 'Iroda', 'Kamila',
            'Madina', 'Nigora', 'Oygul', 'Rayhona', 'Saida', 'Zarina',
        ];
        $lastNames = [
            'Karimov', 'Tursunov', 'Usmanov', 'Qodirov', 'Rahimov', 'Saidov',
            'Yusupov', 'Azimov', 'Ismoilov', 'Raximov', 'Xolmatov', 'Salimov',
            'Karimova', 'Tursunova', 'Usmanova', 'Qodirova', 'Saidova', 'Yusupova',
        ];

        $firstName = fake()->randomElement($firstNames);
        $lastName = fake()->randomElement($lastNames);
        // UZ mobile: +998 + 9 digits, common operator prefixes
        $prefix = fake()->randomElement(['90', '91', '93', '94', '95', '97', '98', '99']);
        $phone = '+998' . $prefix . fake()->numerify('#######');
        $tags = fake()->randomElements(
            ['VIP', 'regular', 'new', 'birthday', 'corporate'],
            fake()->numberBetween(0, 2),
        );

        return [
            'phone' => $phone,
            'email' => fake()->boolean(40)
                ? strtolower($firstName) . fake()->numerify('##') . '@mail.uz'
                : null,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'birthday' => fake()->boolean(60)
                ? fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d')
                : null,
            'locale' => fake()->randomElement(['uz', 'uz', 'uz', 'ru']),
            'gender' => fake()->randomElement(['male', 'female']),
            'avatar_url' => null,
            'tags' => $tags,
            'notes' => null,
            'total_orders' => 0,
            'total_spent' => 0,
            'last_visit_at' => null,
        ];
    }
}
