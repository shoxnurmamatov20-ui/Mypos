<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\AppStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Phase-3 native-app row.
 *
 * One row per (tenant, platform). See migration
 * `2026_06_01_000001_create_tenant_apps_table.php` for column rationale and
 * the lifecycle diagram.
 *
 * The actual EAS Build attempts live on {@see TenantAppBuild}; this row
 * holds the *configuration* (icon, bundle id, store metadata) and a
 * denormalized pointer (`latest_build_id`) to the most recent build for
 * fast list views — Agent D2's Action layer keeps that pointer consistent.
 *
 *
 * @property string $id
 * @property string $tenant_id
 * @property string $platform              ios|android|universal
 * @property string $app_name
 * @property string|null $short_name
 * @property string $bundle_id
 * @property array<string, string> $description   per-locale {uz, ru, en}
 * @property array<int, string>|array<string, mixed> $keywords
 * @property string|null $icon_url
 * @property string|null $splash_url
 * @property string|null $adaptive_icon_url
 * @property string|null $adaptive_icon_bg
 * @property string|null $feature_graphic_url
 * @property array<int, array{device:string,urls:array<int,string>}> $screenshots
 * @property string|null $apple_team_id
 * @property int|null $apple_app_id
 * @property string|null $apple_sku
 * @property string|null $google_package_name
 * @property string|null $google_app_id
 * @property string $build_account                mypos|tenant
 * @property string $status                       see AppStatus
 * @property string|null $current_version
 * @property int|null $current_build_number
 * @property string|null $latest_build_id
 * @property \Illuminate\Support\Carbon|null $submitted_at
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TenantAppBuild> $builds
 * @property-read TenantAppBuild|null $latestBuild
 */
class TenantApp extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'tenant_apps';

    /**
     * DB defaults so freshly-created in-memory models reflect the migration's
     * defaults without round-tripping. Mirrors TenantDomain's pattern.
     */
    protected $attributes = [
        'platform' => 'universal',
        'build_account' => 'mypos',
        'status' => 'draft',
    ];

    protected $fillable = [
        'tenant_id',
        'platform',
        'app_name',
        'short_name',
        'bundle_id',
        'description',
        'keywords',
        'icon_url',
        'splash_url',
        'adaptive_icon_url',
        'adaptive_icon_bg',
        'feature_graphic_url',
        'screenshots',
        'apple_team_id',
        'apple_app_id',
        'apple_sku',
        'google_package_name',
        'google_app_id',
        'build_account',
        'status',
        'current_version',
        'current_build_number',
        'latest_build_id',
        'submitted_at',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'description' => 'array',
            'keywords' => 'array',
            'screenshots' => 'array',
            'apple_app_id' => 'integer',
            'current_build_number' => 'integer',
            'platform' => AppPlatform::class,
            'status' => AppStatus::class,
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    /** Newest-first build history. */
    public function builds(): HasMany
    {
        return $this->hasMany(TenantAppBuild::class, 'tenant_app_id', 'id')
            ->orderByDesc('created_at');
    }

    /**
     * Denormalized pointer — faster than `builds()->latest()->first()` in lists.
     * Falls back to ordering on `builds` if the FK is null (pre-first-build).
     */
    public function latestBuild(): BelongsTo
    {
        return $this->belongsTo(TenantAppBuild::class, 'latest_build_id', 'id');
    }

    /**
     * Quick gate used by {@see \App\Domain\Tenant\Actions\GenerateNativeAppAction}
     * to pre-flight builds. The action additionally checks tier eligibility on
     * the parent tenant — this only covers the per-app prerequisites.
     */
    public function isBuildable(): bool
    {
        return $this->icon_url !== null
            && $this->bundle_id !== ''
            && $this->app_name !== '';
    }
}
