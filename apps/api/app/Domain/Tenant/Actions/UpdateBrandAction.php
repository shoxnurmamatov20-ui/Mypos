<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Actions;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantBrand;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Apply a partial brand update for the tenant.
 *
 * Behavior:
 *   - Only validated keys present in `$data` are persisted (no nulling out
 *     unrelated fields). Caller may explicitly pass `null` to clear a slot.
 *   - Auto-creates the brand row with migration-default colors if it does
 *     not yet exist for the tenant.
 *   - Busts the public-storefront cache so consumer apps see the change
 *     within their next render miss.
 *
 * Tier gating for `custom_css` is enforced at the FormRequest layer — by the
 * time we reach this action, the payload is already trustworthy.
 */
final class UpdateBrandAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(Tenant $tenant, array $data): TenantBrand
    {
        return DB::transaction(function () use ($tenant, $data): TenantBrand {
            $brand = TenantBrand::query()
                ->withoutGlobalScopes(['tenant'])
                ->firstOrCreate(
                    ['tenant_id' => $tenant->id],
                    self::defaults($tenant->id),
                );

            // fill() respects $fillable so any extraneous keys are dropped
            // — safer than forceFill() for a permissive PATCH endpoint.
            $brand->fill($data);
            $brand->save();

            $this->invalidatePublicCache($tenant);

            return $brand->fresh() ?? $brand;
        });
    }

    /**
     * Default values for a freshly-created brand row. Mirrors the migration
     * defaults so a tenant that opens the dashboard before changing anything
     * sees identical colors on `/api/v1/admin/brand` and the public storefront.
     *
     * @return array<string, mixed>
     */
    public static function defaults(string $tenantId): array
    {
        return [
            'tenant_id' => $tenantId,
            'theme' => 'modern',
            'primary_color' => '#EA7C69',
            'accent_color' => '#9333EA',
            'text_color' => '#0F172A',
            'background_color' => '#FFFFFF',
            'font_family' => 'Inter',
        ];
    }

    /**
     * Bust the public marketplace caches keyed on the tenant slug so consumer
     * apps see fresh branding within the next cache miss. Mirrors the pattern
     * used by `MenuCacheObserver` on menu mutations.
     */
    private function invalidatePublicCache(Tenant $tenant): void
    {
        // Best-effort: cache backend may be unavailable in tests / CI.
        try {
            Cache::forget('public:restaurant:' . $tenant->slug);
            Cache::forget('public:menu:' . $tenant->slug);
            Cache::forget('public:brand:' . $tenant->id);
        } catch (\Throwable) {
            // Silent fall-through: a stale cache window is preferable to
            // failing the user's save.
        }
    }
}
