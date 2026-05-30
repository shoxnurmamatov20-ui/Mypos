<?php

declare(strict_types=1);

namespace App\Domain\Customer\Actions;

use App\Domain\Customer\Enums\LoyaltyTier;
use App\Domain\Customer\Models\Customer;
use App\Domain\Customer\Models\LoyaltyAccount;
use App\Domain\Customer\Models\LoyaltyProgram;
use App\Domain\Customer\Models\LoyaltyTransaction;
use App\Domain\Order\Models\Order;
use Illuminate\Support\Facades\DB;

class RecordOrderForCustomerAction
{
    /**
     * Increments the customer's aggregates and, if a loyalty program is active,
     * credits loyalty points earned on the order's total spend.
     */
    public function execute(Order $order): void
    {
        if ($order->customer_id === null) {
            return;
        }

        DB::transaction(function () use ($order): void {
            // Audit C-1 (ADR-0005 follow-up): RLS used to catch a missing
            // tenant_id filter here. Now app-layer is the only guard, so we
            // pin every cross-scope lookup to $order->tenant_id explicitly.
            /** @var Customer|null $customer */
            $customer = Customer::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('tenant_id', $order->tenant_id)
                ->where('id', $order->customer_id)
                ->lockForUpdate()
                ->first();
            if ($customer === null) {
                return;
            }

            $customer->total_orders = $customer->total_orders + 1;
            $customer->total_spent = $customer->total_spent + (int) $order->total_amount;
            $customer->last_visit_at = $order->completed_at ?? $order->paid_at ?? now();
            $customer->save();

            $program = LoyaltyProgram::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('tenant_id', $order->tenant_id)
                ->where('is_active', true)
                ->first();
            if ($program === null) {
                return;
            }

            /** @var LoyaltyAccount|null $account */
            $account = LoyaltyAccount::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('tenant_id', $order->tenant_id)
                ->where('customer_id', $customer->id)
                ->where('program_id', $program->id)
                ->lockForUpdate()
                ->first();

            if ($account === null) {
                $account = LoyaltyAccount::create([
                    'tenant_id' => $order->tenant_id,
                    'customer_id' => $customer->id,
                    'program_id' => $program->id,
                    'tier' => LoyaltyTier::Bronze->value,
                    'points_balance' => 0,
                    'lifetime_points' => 0,
                ]);
            }

            $delta = $program->pointsForSpend((int) $order->total_amount);
            if ($delta <= 0) {
                return;
            }

            $account->points_balance = $account->points_balance + $delta;
            $account->lifetime_points = $account->lifetime_points + $delta;
            $account->tier = LoyaltyTier::fromSpend($customer->total_spent)->value;
            $account->save();

            LoyaltyTransaction::create([
                'tenant_id' => $order->tenant_id,
                'account_id' => $account->id,
                'order_id' => $order->id,
                'delta' => $delta,
                'balance_after' => $account->points_balance,
                'reason' => 'order_earn',
                'metadata' => ['order_total' => (int) $order->total_amount],
                'created_at' => now(),
            ]);
        });
    }
}
