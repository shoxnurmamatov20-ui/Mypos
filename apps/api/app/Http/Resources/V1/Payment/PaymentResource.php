<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Payment;

use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'provider' => $this->provider,
            'provider_transaction_id' => $this->provider_transaction_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'idempotency_key' => $this->idempotency_key,
            'authorized_at' => $this->authorized_at?->toIso8601String(),
            'captured_at' => $this->captured_at?->toIso8601String(),
            'refunded_at' => $this->refunded_at?->toIso8601String(),
            'failed_at' => $this->failed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
