<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Models;

use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Database\Factories\KioskDeviceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $name
 * @property string|null $location_label
 * @property string|null $device_token_hash
 * @property string|null $device_token_last4
 * @property \Illuminate\Support\Carbon|null $paired_at
 * @property \Illuminate\Support\Carbon|null $last_seen_at
 * @property string|null $last_ip_address
 * @property array<string, mixed>|null $device_info
 * @property string $status
 * @property string|null $language
 * @property string|null $theme
 * @property int $idle_timeout_seconds
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 */
class KioskDevice extends Model
{
    /** @use HasFactory<KioskDeviceFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'kiosk_devices';

    protected $fillable = [
        'tenant_id',
        'name',
        'location_label',
        'device_token_hash',
        'device_token_last4',
        'paired_at',
        'last_seen_at',
        'last_ip_address',
        'device_info',
        'status',
        'language',
        'theme',
        'idle_timeout_seconds',
        'notes',
    ];

    protected $hidden = [
        'device_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'device_info' => 'array',
            'paired_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'idle_timeout_seconds' => 'integer',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'kiosk_device_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Compute the storable hash for a plaintext device token. We use SHA-256
     * (not bcrypt) so that the unique index on `device_token_hash` can be used
     * for fast lookups during request authentication. Tokens are randomly
     * generated 64-char strings — their entropy makes a fast hash sufficient.
     */
    public static function hashToken(string $plain): string
    {
        return hash('sha256', $plain);
    }

    protected static function newFactory(): KioskDeviceFactory
    {
        return KioskDeviceFactory::new();
    }
}
