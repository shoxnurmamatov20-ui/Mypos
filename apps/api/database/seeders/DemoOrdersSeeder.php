<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Table\Models\Table;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates realistic historical orders for the demo tenant over the last 30 days
 * so the Reports dashboard has meaningful data to visualize.
 */
class DemoOrdersSeeder extends Seeder
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
            $this->command?->warn('Demo tenant not found; skipping orders seed.');
            return;
        }

        // Skip if there are already orders (idempotent-ish)
        $existing = Order::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count();
        if ($existing > 5) {
            $this->command?->info("Tenant already has {$existing} orders; skipping to avoid duplicates.");
            return;
        }

        $menuItems = MenuItem::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();
        if ($menuItems->isEmpty()) {
            $this->command?->warn('No menu items found; run DemoMenuSeeder first.');
            return;
        }

        $tables = Table::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->get();
        $employee = User::where('email', 'owner@demo.mypos.uz')->first();
        if ($employee === null) {
            $this->command?->warn('Demo employee not found; run DemoTenantSeeder first.');
            return;
        }

        $orderTypes = ['dine_in', 'dine_in', 'dine_in', 'takeaway', 'qr_menu', 'telegram'];
        $paymentMethods = ['cash', 'cash', 'click', 'payme', 'card', 'uzum'];

        DB::transaction(function () use ($tenant, $menuItems, $tables, $employee, $orderTypes, $paymentMethods): void {
            $totalCreated = 0;

            for ($daysAgo = 29; $daysAgo >= 0; $daysAgo--) {
                // Business hours below are Tashkent wall-clock times; build the
                // moment in the restaurant's timezone, then store as UTC like
                // every real order (app timezone is UTC).
                $day = now('Asia/Tashkent')->subDays($daysAgo);

                // More orders on weekends + recent days (simulated traffic curve)
                $ordersForDay = fake()->numberBetween(8, 22);
                if ($day->isWeekend()) $ordersForDay += fake()->numberBetween(3, 8);
                if ($daysAgo < 7) $ordersForDay += fake()->numberBetween(2, 5);

                for ($o = 0; $o < $ordersForDay; $o++) {
                    $hour = fake()->randomElement([11, 12, 13, 13, 14, 18, 19, 19, 20, 20, 21]);
                    $minute = fake()->numberBetween(0, 59);
                    $placedAt = $day->copy()->setTime($hour, $minute)->setTimezone('UTC');

                    // Today's not-yet-reached dinner slots would land in the
                    // future — a "-42 minutes ago" order card. Skip them.
                    if ($placedAt->isFuture()) {
                        continue;
                    }

                    $type = fake()->randomElement($orderTypes);
                    $table = $type === 'dine_in' ? $tables->random() : null;

                    $lineCount = fake()->numberBetween(1, 5);
                    $lines = $menuItems->random(min($lineCount, $menuItems->count()))->values();

                    $subtotal = 0;
                    $itemsPayload = [];
                    foreach ($lines as $menuItem) {
                        $qty = fake()->numberBetween(1, 3);
                        $lineSubtotal = $menuItem->price_amount * $qty;
                        $subtotal += $lineSubtotal;
                        $itemsPayload[] = [
                            'menu_item_id' => $menuItem->id,
                            'name_snapshot' => $menuItem->name['uz'] ?? 'Item',
                            'price_amount' => $menuItem->price_amount,
                            'quantity' => $qty,
                            'subtotal_amount' => $lineSubtotal,
                            'currency' => 'UZS',
                            'status' => 'served',
                        ];
                    }

                    // 95% of historical orders are completed
                    $isCompleted = fake()->boolean(95);
                    $status = $isCompleted ? 'completed' : fake()->randomElement(['pending', 'preparing', 'cancelled']);
                    $preparedAt = $placedAt->copy()->addMinutes(fake()->numberBetween(8, 25));
                    $servedAt = $preparedAt->copy()->addMinutes(fake()->numberBetween(2, 8));
                    $completedAt = $servedAt->copy()->addMinutes(fake()->numberBetween(20, 80));

                    // An order placed minutes ago cannot already be "completed
                    // 80 minutes later" — keep the lifecycle inside the past.
                    if ($isCompleted && $completedAt->isFuture()) {
                        $isCompleted = false;
                        $status = 'preparing';
                    }

                    $order = Order::create([
                        'tenant_id' => $tenant->id,
                        'order_no' => 'O' . $day->format('ymd') . '-' . str_pad((string) ($o + 100), 4, '0', STR_PAD_LEFT),
                        'type' => $type,
                        'status' => $status,
                        'payment_status' => $isCompleted ? 'paid' : 'unpaid',
                        'payment_method' => $isCompleted ? fake()->randomElement($paymentMethods) : null,
                        'table_id' => $table?->id,
                        'employee_id' => $employee->uuid,
                        'guest_count' => $type === 'dine_in' ? fake()->numberBetween(1, 6) : null,
                        'subtotal_amount' => $subtotal,
                        'total_amount' => $subtotal,
                        'paid_amount' => $isCompleted ? $subtotal : 0,
                        'currency' => 'UZS',
                        'placed_at' => $placedAt,
                        'prepared_at' => $isCompleted ? $preparedAt : null,
                        'served_at' => $isCompleted ? $servedAt : null,
                        'paid_at' => $isCompleted ? $completedAt : null,
                        'completed_at' => $isCompleted ? $completedAt : null,
                        'cancelled_at' => $status === 'cancelled' ? $placedAt->copy()->addMinutes(5) : null,
                        'created_at' => $placedAt,
                        'updated_at' => $isCompleted ? $completedAt : $placedAt,
                    ]);

                    foreach ($itemsPayload as $line) {
                        OrderItem::create([
                            'tenant_id' => $tenant->id,
                            'order_id' => $order->id,
                            'menu_item_id' => $line['menu_item_id'],
                            'name_snapshot' => $line['name_snapshot'],
                            'price_amount' => $line['price_amount'],
                            'quantity' => $line['quantity'],
                            'subtotal_amount' => $line['subtotal_amount'],
                            'currency' => 'UZS',
                            'status' => $line['status'],
                            'created_at' => $placedAt,
                            'updated_at' => $isCompleted ? $completedAt : $placedAt,
                        ]);
                    }
                    $totalCreated++;
                }
            }

            $this->command?->info("Seeded {$totalCreated} historical orders over 30 days.");
        });
    }
}
