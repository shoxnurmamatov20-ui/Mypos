<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Database\Factories\KioskPairingCodeFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $code
 * @property string|null $device_id
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $consumed_at
 * @property string|null $created_by_user_uuid
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Tenant $tenant
 * @property-read KioskDevice|null $device
 * @property-read User|null $createdBy
 */
class KioskPairingCode extends Model
{
    /** @use HasFactory<KioskPairingCodeFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'kiosk_pairing_codes';

    protected $fillable = [
        'tenant_id',
        'code',
        'device_id',
        'expires_at',
        'consumed_at',
        'created_by_user_uuid',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(KioskDevice::class, 'device_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_uuid', 'uuid');
    }

    public function isUsable(): bool
    {
        return $this->consumed_at === null && $this->expires_at->isFuture();
    }

    protected static function newFactory(): KioskPairingCodeFactory
    {
        return KioskPairingCodeFactory::new();
    }
}
