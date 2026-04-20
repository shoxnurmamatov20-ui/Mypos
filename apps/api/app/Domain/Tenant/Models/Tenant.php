<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

/**
 * @property string $id
 * @property string $slug
 * @property string $name
 * @property string|null $legal_name
 * @property string $plan
 * @property string $status
 * @property string $default_locale
 * @property string $default_currency
 * @property string $timezone
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $logo_url
 * @property array<string, mixed>|null $settings
 * @property array<string, mixed>|null $feature_flags
 * @property \Illuminate\Support\Carbon|null $trial_ends_at
 * @property \Illuminate\Support\Carbon|null $suspended_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'tenants';

    protected $fillable = [
        'slug',
        'name',
        'legal_name',
        'plan',
        'status',
        'default_locale',
        'default_currency',
        'timezone',
        'phone',
        'email',
        'logo_url',
        'settings',
        'feature_flags',
        'trial_ends_at',
        'suspended_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'feature_flags' => 'array',
            'trial_ends_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->suspended_at === null;
    }
}
