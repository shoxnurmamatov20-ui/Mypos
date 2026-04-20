<?php

declare(strict_types=1);

namespace App\Domain\Payment\Models;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $order_id
 * @property string $provider
 * @property string|null $provider_transaction_id
 * @property int $amount
 * @property string $currency
 * @property string $status
 * @property string|null $failure_reason
 * @property array<string, mixed>|null $raw_request
 * @property array<string, mixed>|null $raw_response
 * @property string|null $idempotency_key
 * @property \Illuminate\Support\Carbon|null $authorized_at
 * @property \Illuminate\Support\Carbon|null $captured_at
 * @property \Illuminate\Support\Carbon|null $refunded_at
 * @property \Illuminate\Support\Carbon|null $failed_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'payments';

    protected $fillable = [
        'tenant_id', 'order_id',
        'provider', 'provider_transaction_id',
        'amount', 'currency',
        'status', 'failure_reason',
        'raw_request', 'raw_response',
        'idempotency_key',
        'authorized_at', 'captured_at', 'refunded_at', 'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'raw_request' => 'array',
            'raw_response' => 'array',
            'authorized_at' => 'datetime',
            'captured_at' => 'datetime',
            'refunded_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function providerEnum(): PaymentProvider
    {
        return PaymentProvider::from($this->provider);
    }

    public function statusEnum(): PaymentStatus
    {
        return PaymentStatus::from($this->status);
    }

    protected static function newFactory(): PaymentFactory
    {
        return PaymentFactory::new();
    }
}
