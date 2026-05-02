<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Enums\TenantTier;

/**
 * Single source of truth for tier → feature flag mapping.
 *
 * Used by:
 *   - `GET /api/v1/admin/tier-features` to expose the matrix to the dashboard.
 *   - FormRequests to gate Plus+ fields (custom_css, custom_domain).
 *   - Filament resource visibility rules.
 *
 * Two consumption styles are supported:
 *
 *   1. Static matrix     — `TierFeatures::matrix($tier)` returns the full
 *                          feature array (used by the API endpoint + tests).
 *   2. Object capability — `TierFeatures::for($tier)->canUseCustomDomain()`
 *                          (used by Filament UI per Agent C4 contract).
 *
 * Numeric limits (`max_domains`, `max_locations`) are exposed as ints so
 * the UI can render a sentinel ("unlimited") for very large values.
 */
final class TierFeatures
{
    /** Sentinel returned for "effectively unlimited" numeric features. */
    public const UNLIMITED = 9999;

    public function __construct(public readonly TenantTier $tier)
    {
    }

    /**
     * Resolve a tier-like value (enum, plain string, null) to a {@see TierFeatures}
     * instance. Unknown / null values fall back to `Free` so calling code never
     * has to guard against missing tier columns on legacy tenants.
     */
    public static function for(mixed $tier): self
    {
        if ($tier instanceof TenantTier) {
            return new self($tier);
        }
        if (is_string($tier) && $tier !== '') {
            return new self(TenantTier::tryFrom($tier) ?? TenantTier::Free);
        }
        return new self(TenantTier::Free);
    }

    /**
     * Static feature matrix used by the admin tier-features endpoint and tests.
     *
     * Phase-4 (Agent E3) adds four additional flags layered on top of the
     * existing `ai_features` / `ai_daily_limit` axis from Agent E2:
     *
     *   - `forecast_basic`       — top-items / low-sellers (statistical, no AI cost). Pro+.
     *   - `forecast_predictive`  — naive next-week regression. Plus+.
     *   - `chatbot`              — restaurant-aware customer chatbot. Plus+.
     *   - `insights_narrative`   — Claude-narrated business analysis. Enterprise only.
     *
     * Adding new keys is backward-compatible: existing callers reading
     * `marketplace` / `ai_features` / etc. keep working unchanged.
     *
     * @return array{
     *     marketplace: bool,
     *     subdomain: bool,
     *     custom_domain: bool,
     *     native_app: bool,
     *     custom_css: bool,
     *     branding_presets: bool,
     *     priority_support: bool,
     *     ai_features: bool,
     *     forecast_basic: bool,
     *     forecast_predictive: bool,
     *     chatbot: bool,
     *     insights_narrative: bool,
     *     max_domains: int,
     *     max_locations: int,
     *     ai_daily_limit: int,
     * }
     */
    public static function matrix(string|TenantTier $tier): array
    {
        $resolved = $tier instanceof TenantTier
            ? $tier
            : (TenantTier::tryFrom($tier) ?? TenantTier::Free);

        return match ($resolved) {
            TenantTier::Free => [
                'marketplace' => true,
                'subdomain' => false,
                'custom_domain' => false,
                'native_app' => false,
                'custom_css' => false,
                'branding_presets' => false,
                'priority_support' => false,
                'ai_features' => false,
                // Phase-4 (Agent E3) — AI features off for Free tier.
                'forecast_basic' => false,
                'forecast_predictive' => false,
                'chatbot' => false,
                'insights_narrative' => false,
                'max_domains' => 0,
                'max_locations' => 1,
                'ai_daily_limit' => 0,
            ],
            TenantTier::Pro => [
                'marketplace' => true,
                'subdomain' => true,
                'custom_domain' => false,
                'native_app' => false,
                'custom_css' => false,
                'branding_presets' => true,
                'priority_support' => false,
                'ai_features' => true,
                // Phase-4 — Pro unlocks the statistical forecast (no AI cost).
                'forecast_basic' => true,
                'forecast_predictive' => false,
                'chatbot' => false,
                'insights_narrative' => false,
                'max_domains' => 0,
                'max_locations' => 3,
                'ai_daily_limit' => 50,
            ],
            TenantTier::Plus => [
                'marketplace' => true,
                'subdomain' => true,
                'custom_domain' => true,
                'native_app' => false,
                'custom_css' => true,
                'branding_presets' => true,
                'priority_support' => true,
                'ai_features' => true,
                // Phase-4 — Plus adds predictive forecast + customer chatbot.
                // Both burn AI tokens, so lower tiers redirect to FAQ.
                'forecast_basic' => true,
                'forecast_predictive' => true,
                'chatbot' => true,
                'insights_narrative' => false,
                // Plus is gated to a single managed custom domain — additional
                // slots (www aliases) are reserved for Enterprise multi-domain.
                'max_domains' => 1,
                'max_locations' => 10,
                'ai_daily_limit' => 500,
            ],
            TenantTier::Enterprise => [
                'marketplace' => true,
                'subdomain' => true,
                'custom_domain' => true,
                'native_app' => true,
                'custom_css' => true,
                'branding_presets' => true,
                'priority_support' => true,
                'ai_features' => true,
                // Phase-4 — Enterprise additionally unlocks Claude-narrated
                // business analysis (`insights_narrative`).
                'forecast_basic' => true,
                'forecast_predictive' => true,
                'chatbot' => true,
                'insights_narrative' => true,
                'max_domains' => 10,
                'max_locations' => self::UNLIMITED,
                'ai_daily_limit' => self::UNLIMITED,
            ],
        };
    }

    /** Convenience: bool flag lookup for an ad-hoc feature name. */
    public static function has(string|TenantTier $tier, string $feature): bool
    {
        $matrix = self::matrix($tier);
        $value = $matrix[$feature] ?? false;
        return is_bool($value) ? $value : false;
    }

    /** Convenience: numeric limit lookup. */
    public static function limit(string|TenantTier $tier, string $feature): int
    {
        $matrix = self::matrix($tier);
        $value = $matrix[$feature] ?? 0;
        return is_int($value) ? $value : 0;
    }

    // ---- Object capability surface (kept for Agent C4 / Filament) -----------

    public function canUseCustomDomain(): bool
    {
        return self::has($this->tier, 'custom_domain');
    }

    public function canUseCustomCss(): bool
    {
        return self::has($this->tier, 'custom_css');
    }

    public function canUseCustomSubdomain(): bool
    {
        return self::has($this->tier, 'subdomain');
    }

    public function canUseAdvancedBranding(): bool
    {
        return self::has($this->tier, 'branding_presets');
    }

    /**
     * Multi-domain (defined as managing more than a single live domain
     * simultaneously) is an Enterprise-only capability per the Phase-2 spec.
     * Plus tenants are gated to a single primary custom domain even though
     * `max_domains` reports a count > 1 (the extra slots are reserved for
     * www-redirect aliases — counted but not user-managed).
     */
    public function canUseMultipleDomains(): bool
    {
        return $this->tier->atLeast(TenantTier::Enterprise);
    }

    public function canUseNativeApp(): bool
    {
        return self::has($this->tier, 'native_app');
    }

    /**
     * Phase-4 capability: AI menu generator, translator, descriptions.
     * Pro+ only — Free is gated out at the controller layer with a 402.
     */
    public function canUseAiFeatures(): bool
    {
        return self::has($this->tier, 'ai_features');
    }

    /**
     * Phase-4 (Agent E3) — statistical demand forecasting (top items, low
     * sellers). No AI cost. Pro+.
     */
    public function canUseForecastBasic(): bool
    {
        return self::has($this->tier, 'forecast_basic');
    }

    /**
     * Phase-4 — predictive next-week regression. Plus+.
     */
    public function canUseForecastPredictive(): bool
    {
        return self::has($this->tier, 'forecast_predictive');
    }

    /**
     * Phase-4 — customer-facing chatbot. Plus+ (lower tiers redirect to FAQ).
     */
    public function canUseChatbot(): bool
    {
        return self::has($this->tier, 'chatbot');
    }

    /**
     * Phase-4 — Claude-narrated business insights. Enterprise only.
     */
    public function canUseInsightsNarrative(): bool
    {
        return self::has($this->tier, 'insights_narrative');
    }

    public function maxDomains(): int
    {
        return self::limit($this->tier, 'max_domains');
    }

    public function maxLocations(): int
    {
        return self::limit($this->tier, 'max_locations');
    }

    /**
     * Per-day request limit against the AI provider. UNLIMITED for Enterprise.
     * Used by {@see \App\Domain\AI\Services\AiQuotaGuard}.
     */
    public function aiDailyLimit(): int
    {
        return self::limit($this->tier, 'ai_daily_limit');
    }
}
