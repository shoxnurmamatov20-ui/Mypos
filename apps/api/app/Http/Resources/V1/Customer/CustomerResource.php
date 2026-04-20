<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Customer;

use App\Domain\Customer\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Customer
 */
class CustomerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phone' => $this->phone,
            'email' => $this->email,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->fullName(),
            'birthday' => $this->birthday?->toDateString(),
            'locale' => $this->locale,
            'gender' => $this->gender,
            'avatar_url' => $this->avatar_url,

            'tags' => $this->tags ?? [],
            'notes' => $this->notes,

            'total_orders' => (int) $this->total_orders,
            'total_spent' => (int) $this->total_spent,
            'last_visit_at' => $this->last_visit_at?->toIso8601String(),

            'loyalty_account' => LoyaltyAccountResource::make($this->whenLoaded('loyaltyAccount')),

            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
