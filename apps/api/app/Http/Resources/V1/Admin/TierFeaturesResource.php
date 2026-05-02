<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use App\Domain\Tenant\Enums\TenantTier;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Tenant
 */
class TierFeaturesResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $effective = $this->resolveEffectiveTier();
        $features = TierFeatures::for($effective);
        $matrix = TierFeatures::matrix($effective);

        return [
            // Echo the *configured* tier so the dashboard can show
            // "Plus (expired)" for downgraded tenants. The capability flags
            // below reflect the *effective* tier after expiry.
            'tier' => $this->tier ?? 'free',
            'effective_tier' => $effective->value,
            'tier_started_at' => $this->tier_started_at?->toIso8601String(),
            'tier_expires_at' => $this->tier_expires_at?->toIso8601String(),
            'is_expired' => $this->isTierExpired(),

            // Object-style capability booleans — convenience for callers that
            // already know which feature they care about (mirrors the
            // FilamentResource consumption pattern).
            'can_use_subdomain' => $features->canUseCustomSubdomain(),
            'can_use_custom_domain' => $features->canUseCustomDomain(),
            'can_use_custom_css' => $features->canUseCustomCss(),
            'can_use_advanced_branding' => $features->canUseAdvancedBranding(),
            'can_use_multiple_domains' => $features->canUseMultipleDomains(),
            'can_use_native_app' => $features->canUseNativeApp(),

            // Full matrix — mirrors the spec's `features` block. Keep both
            // shapes; clients can pick the convenient one.
            'features' => $matrix,

            // Numeric limits surfaced top-level for the upgrade-prompt UI.
            'max_domains' => $features->maxDomains(),
            'max_locations' => $features->maxLocations(),
        ];
    }

    /**
     * Compute the *effective* tier honoured by capability gates. If
     * `tier_expires_at` is in the past, the tenant has lapsed billing and
     * we downgrade to Free until renewal (matches the Pest contract).
     */
    private function resolveEffectiveTier(): TenantTier
    {
        if ($this->isTierExpired()) {
            return TenantTier::Free;
        }
        $tier = is_string($this->tier) ? $this->tier : 'free';
        return TenantTier::tryFrom($tier) ?? TenantTier::Free;
    }

    private function isTierExpired(): bool
    {
        if ($this->tier_expires_at === null) {
            return false;
        }
        return $this->tier_expires_at->isPast();
    }
}
