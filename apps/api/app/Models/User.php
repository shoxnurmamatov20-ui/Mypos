<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Tenant\Models\Tenant;
use App\Models\Observers\UserSecurityObserver;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $uuid
 * @property string|null $tenant_id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string $locale
 * @property string|null $avatar_url
 * @property string $password
 * @property bool $is_super_admin
 * @property string|null $super_admin_role
 * @property \Illuminate\Support\Carbon|null $last_super_admin_login_at
 * @property bool $mfa_enabled
 * @property string|null $mfa_secret
 * @property \Illuminate\Support\Carbon|null $last_login_at
 * @property string|null $last_login_ip
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 */
#[ObservedBy([UserSecurityObserver::class])]
class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;
    use HasApiTokens;
    use HasRoles;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'email',
        'phone',
        'locale',
        'avatar_url',
        'password',
        'is_super_admin',
        'super_admin_role',
        'last_super_admin_login_at',
        'mfa_enabled',
        'mfa_secret',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mfa_secret',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if ($user->uuid === null || $user->uuid === '') {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_super_admin_login_at' => 'datetime',
            'is_super_admin' => 'boolean',
            'mfa_enabled' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Tenants this user OWNS as a CEO/business-owner (via `tenant_owners`
     * pivot). Distinct from `tenant()` which is the single tenant this
     * user is *employed at* (cashier, waiter, manager scope). A CEO may
     * own 5 restaurants and not be employed at any of them.
     *
     * @return BelongsToMany<Tenant>
     */
    public function ownedTenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_owners')
            ->withPivot(['is_primary', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * UUIDs of every tenant this user owns — convenient for cross-tenant
     * scoped queries inside `/api/v1/ceo/*` controllers.
     *
     * @return array<string>
     */
    public function ownedTenantIds(): array
    {
        return $this->ownedTenants()->pluck('tenants.id')->all();
    }

    /**
     * Filament access — only super admins can reach the /admin panel.
     * Tenant users have their own dashboards.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_super_admin === true;
    }
}
