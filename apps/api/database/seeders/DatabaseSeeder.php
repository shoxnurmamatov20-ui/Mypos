<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            RegionSeeder::class,
            DistrictSeeder::class,
            DemoTenantSeeder::class,
            DemoMenuSeeder::class,
            DemoTablesSeeder::class,
            DemoOrdersSeeder::class,
            DemoCustomersSeeder::class,
            DemoEmployeesSeeder::class,
            DemoInventorySeeder::class,
            // CEO chain demo: ceo@mypos.uz owning 5 sample tenants — exercises
            // the super-admin → CEO → manager hierarchy end-to-end locally.
            DemoCeoSeeder::class,
            ClinicSeeder::class,
        ]);
    }
}
