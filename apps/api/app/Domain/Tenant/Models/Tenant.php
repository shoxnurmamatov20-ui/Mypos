<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Models;

use App\Domain\Shared\Models\Country;
use App\Domain\Shared\Models\Currency;
use App\Domain\Shared\ValueObjects\Money;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domain\Tenant\Services\TierFeatures;
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
 * @property string $subscription_plan
 * @property string $subscription_status
 * @property int $mrr_minor
 * @property \Illuminate\Support\Carbon|null $subscription_ends_at
 * @property string|null $suspension_reason
 * @property \Illuminate\Support\Carbon|null $last_active_at
 * @property int $total_orders_count
 * @property int $total_revenue_minor
 * @property string|null $notes
 * @property string $tier                   Phase-2 capability axis: free|pro|plus|enterprise
 * @property \Illuminate\Support\Carbon|null $tier_started_at
 * @property \Illuminate\Support\Carbon|null $tier_expires_at
 * @property string $country_code            Phase-4 ISO 3166-1 alpha-2 (FK → countries.code)
 * @property string $currency_code           Phase-4 ISO 4217 (FK → currencies.code)
 * @property-read \App\Domain\Tenant\Models\TenantBrand|null $brand
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Domain\Tenant\Models\TenantDomain> $domains
 * @property-read Country|null $country
 * @property-read Currency|null $currency
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
        // 'feature_flags' removed — only super-admin Actions can mutate
        // capability flags. Use forceFill() in dedicated SuperAdmin actions.
        'trial_ends_at',
        'suspended_at',
        'subscription_plan',
        'subscription_status',
        'mrr_minor',
        'subscription_ends_at',
        'suspension_reason',
        'last_active_at',
        'total_orders_count',
        'total_revenue_minor',
        'notes',
        // Removed from fillable to prevent mass-assignment tier escalation
        // ('tier', 'tier_started_at', 'tier_expires_at'). All tier mutations
        // must go through ChangeTenantTierAction (super-admin only) using
        // explicit forceFill — never via $tenant->update($request->all()).
        'country_code',
        'currency_code',
    ];


    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'feature_flags' => 'array',
            'trial_ends_at' => 'datetime',
            'suspended_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'last_active_at' => 'datetime',
            'mrr_minor' => 'integer',
            'total_orders_count' => 'integer',
            'total_revenue_minor' => 'integer',
            'tier_started_at' => 'datetime',
            'tier_expires_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Business owners (CEOs) of this tenant via the `tenant_owners` pivot.
     * A tenant typically has 1 primary owner, plus optional co-owners or
     * partners listed for cross-tenant visibility.
     *
     * @return BelongsToMany<User>
     */
    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_owners')
            ->withPivot(['is_primary', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * 1:1 brand row — see {@see \App\Domain\Tenant\Models\TenantBrand}.
     * The brand row is created lazily by the admin brand controller the first
     * time a tenant fetches `/api/v1/admin/brand`, so this relation is
     * frequently null on legacy tenants.
     */
    public function brand(): HasOne
    {
        return $this->hasOne(TenantBrand::class, 'tenant_id', 'id');
    }

    /**
     * Custom domains attached to the tenant (verified or pending).
     * Excludes soft-deleted rows by default via {@see TenantDomain}'s SoftDeletes.
     */
    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class, 'tenant_id', 'id');
    }

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->suspended_at === null;
    }

    /**
     * Phase 3 — does the tenant's tier include white-labelled native apps?
     *
     * Currently Enterprise-only per {@see TierFeatures::matrix()}; checked by
     * {@see \App\Domain\Tenant\Actions\GenerateNativeAppAction} before
     * dispatching an EAS Build, and by the AppPolicy / FormRequest layer for
     * 403/422 surfaces in the dashboard.
     */
    public function canUseNativeApp(): bool
    {
        return TierFeatures::for($this->tier)->canUseNativeApp();
    }

    /** Phase 3 — all native-app config rows owned by this tenant. */
    public function apps(): HasMany
    {
        return $this->hasMany(TenantApp::class, 'tenant_id', 'id');
    }

    // -----------------------------------------------------------------
    // Phase 4 — multi-region relations & helpers
    // -----------------------------------------------------------------

    /** ISO 3166-1 country (UZ, KZ, KG, TJ, …). */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_code', 'code');
    }

    /** ISO 4217 currency (UZS, KZT, KGS, TJS, …). */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    /**
     * The tenant's "home" currency code, with a safe fallback. Prefers the
     * Phase-4 normalised `currency_code` column; falls back to the legacy
     * free-text `default_currency`; final fallback is UZS (every Phase-1
     * tenant is in Uzbekistan).
     */
    public function homeCurrency(): string
    {
        $code = strtoupper((string) ($this->currency_code ?: $this->default_currency ?: 'UZS'));
        return preg_match('/^[A-Z]{3}$/', $code) === 1 ? $code : 'UZS';
    }

    /**
     * Convenience: zero-money in this tenant's home currency. Useful for
     * starting reduce/sum chains on collections of orders.
     */
    public function zeroMoney(): Money
    {
        return Money::zero($this->homeCurrency());
    }
}
