<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Phase-2 custom-domain row.
 *
 * One row per (tenant, hostname). The `domain` column is globally unique so
 * two tenants cannot claim the same hostname.
 *
 * Lifecycle (see migration 2026_05_15_000001_create_tenant_domains_table):
 *   pending    → DNS TXT/CNAME proof not yet observed
 *   provisioning → Caddy ACME issuing certificate
 *   active     → Caddy serving live traffic
 *   error      → most recent attempt failed (see ssl_error)
 *
 * @property string $id
 * @property string $tenant_id
 * @property string $domain
 * @property bool $is_primary
 * @property bool $is_verified
 * @property string $verification_method
 * @property string $verification_token
 * @property \Illuminate\Support\Carbon|null $verified_at
 * @property string $ssl_status
 * @property \Illuminate\Support\Carbon|null $ssl_issued_at
 * @property string|null $ssl_error
 * @property \Illuminate\Support\Carbon|null $last_checked_at
 * @property string|null $redirects_to
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 */
class TenantDomain extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'tenant_domains';

    /**
     * Match DB defaults so newly-created models reflect them without `->fresh()`.
     */
    protected $attributes = [
        'is_primary' => false,
        'is_verified' => false,
        'verification_method' => 'txt',
        'ssl_status' => 'pending',
    ];

    protected $fillable = [
        'tenant_id',
        'domain',
        'is_primary',
        'is_verified',
        'verification_method',
        'verification_token',
        'verified_at',
        'ssl_status',
        'ssl_issued_at',
        'ssl_error',
        'last_checked_at',
        'redirects_to',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
            'ssl_issued_at' => 'datetime',
            'last_checked_at' => 'datetime',
        ];
    }
}
