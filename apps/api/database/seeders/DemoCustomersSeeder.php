<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Customer\Enums\LoyaltyTier;
use App\Domain\Customer\Models\Customer;
use App\Domain\Customer\Models\LoyaltyAccount;
use App\Domain\Customer\Models\LoyaltyProgram;
use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds ~30 customers for the demo tenant, creates a default loyalty program,
 * attaches loyalty accounts, and links a few customers to existing orders.
 */
class DemoCustomersSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn(static::class . ' refused to run outside local/testing environments.');
            return;
        }

        // Demo seeders run from artisan (no Auth user). Opt-in to lenient
        // BelongsToTenant scope so existing-row lookups behave as before.
        BelongsToTenant::allowEmptyTenantContext();

        $tenant = Tenant::where('slug', 'demo-restaurant')->first();
        if ($tenant === null) {
            $this->command?->warn('Demo tenant not found; skipping customers seed.');
            return;
        }

        $existing = Customer::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->count();
        if ($existing >= 30) {
            $this->command?->info("Tenant already has {$existing} customers; skipping.");
            return;
        }

        DB::transaction(function () use ($tenant): void {
            // Ensure an active loyalty program exists for the tenant.
            $program = LoyaltyProgram::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->first();
            if ($program === null) {
                $program = LoyaltyProgram::create([
                    'tenant_id' => $tenant->id,
                    'name' => [
                        'uz' => 'Demo sodiqlik dasturi',
                        'ru' => 'Демо программа лояльности',
                        'en' => 'Demo loyalty program',
                    ],
                    'is_active' => true,
                    'points_per_currency_unit' => 0.01,  // 1 point per 100 UZS
                    'redemption_rate_uzs' => 10,
                    'tier_rules' => null,
                ]);
            }

            $customers = Customer::factory()->count(30)->create([
                'tenant_id' => $tenant->id,
            ]);

            foreach ($customers as $index => $customer) {
                // Synthetic spend/visits so the dashboard has meaningful data.
                $totalOrders = fake()->numberBetween(0, 40);
                $totalSpent = $totalOrders === 0
                    ? 0
                    : fake()->numberBetween(50_000, 250_000) * $totalOrders;
                $lastVisit = $totalOrders > 0
                    ? fake()->dateTimeBetween('-60 days', 'now')
                    : null;

                $customer->update([
                    'total_orders' => $totalOrders,
                    'total_spent' => $totalSpent,
                    'last_visit_at' => $lastVisit,
                ]);

                $tier = LoyaltyTier::fromSpend($totalSpent)->value;
                $lifetimePoints = $program->pointsForSpend($totalSpent);

                LoyaltyAccount::create([
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer->id,
                    'program_id' => $program->id,
                    'tier' => $tier,
                    'points_balance' => $lifetimePoints,
                    'lifetime_points' => $lifetimePoints,
                ]);
            }

            // Link the first ~15 unlinked paid orders to random customers so the
            // relationship is exercised end-to-end in the UI.
            $linkable = Order::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->whereNull('customer_id')
                ->where('payment_status', 'paid')
                ->limit(15)
                ->get();
            foreach ($linkable as $order) {
                $picked = $customers->random();
                $order->update(['customer_id' => $picked->id]);
            }

            $this->command?->info("Seeded {$customers->count()} customers with loyalty accounts.");
        });
    }
}
