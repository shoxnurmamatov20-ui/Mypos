<?php

declare(strict_types=1);

namespace App\Domain\Customer\Actions;

use App\Domain\Customer\Enums\LoyaltyTier;
use App\Domain\Customer\Models\Customer;
use App\Domain\Customer\Models\LoyaltyAccount;
use App\Domain\Customer\Models\LoyaltyProgram;
use Illuminate\Support\Facades\DB;

class CreateCustomerAction
{
    /**
     * Create a customer and attach a loyalty account if an active program exists
     * for the tenant.
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(array $data): Customer
    {
        return DB::transaction(function () use ($data): Customer {
            $customer = Customer::create($data);

            $tenantId = $customer->tenant_id;
            $program = LoyaltyProgram::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->first();

            if ($program !== null) {
                LoyaltyAccount::create([
                    'tenant_id' => $tenantId,
                    'customer_id' => $customer->id,
                    'program_id' => $program->id,
                    'tier' => LoyaltyTier::Bronze->value,
                    'points_balance' => 0,
                    'lifetime_points' => 0,
                ]);
            }

            return $customer->fresh(['loyaltyAccount']);
        });
    }
}
