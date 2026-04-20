<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Customer;

use App\Domain\Customer\Models\LoyaltyAccount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LoyaltyAccount
 */
class LoyaltyAccountResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'program_id' => $this->program_id,
            'tier' => $this->tier,
            'points_balance' => $this->points_balance,
            'lifetime_points' => $this->lifetime_points,
        ];
    }
}
