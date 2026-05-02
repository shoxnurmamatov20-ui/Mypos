<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Observers;

use App\Domain\Shared\Models\Country;
use App\Domain\Tenant\Models\Tenant;

/**
 * Phase 4 — derive `currency_code` (and timezone defaults) from the
 * tenant's `country_code` when not explicitly set.
 *
 * Hooks `creating` so the derivation runs BEFORE the row is persisted —
 * this lets the FK constraint at the DB layer enforce a clean
 * country-currency mapping. The country lookup is cached for the request
 * to avoid repeated DB hits when the signup wizard creates several
 * dependent rows in a single transaction.
 *
 * Why an Observer (not a Tenant::booted() boot method):
 *   - Decouples the geo-derivation logic from the Tenant model so unit
 *     tests can run without the country table being seeded.
 *   - Mirrors the same pattern used by MenuCacheObserver — the codebase's
 *     conventional way of expressing "do this on every X mutation".
 *
 * Registered in {@see \App\Providers\AppServiceProvider::boot}.
 */
class TenantRegionObserver
{
    /** Per-request memoization so signup wizards don't re-query the same row. */
    private array $countryCache = [];

    public function creating(Tenant $tenant): void
    {
        $countryCode = strtoupper((string) ($tenant->country_code ?? 'UZ'));
        $tenant->country_code = $countryCode;

        $country = $this->findCountry($countryCode);
        if ($country === null) {
            // Unknown country code — let the FK constraint produce the
            // canonical error. We don't try to be clever here.
            return;
        }

        // Currency: only auto-fill when caller didn't specify. Lets the
        // caller explicitly choose USD for an enterprise tenant in a
        // KZT-default country, etc.
        if (empty($tenant->currency_code)) {
            $tenant->currency_code = $country->currency_code;
        }
        // Mirror onto the legacy free-text column too so the read paths
        // that still use `default_currency` see the same value.
        if (empty($tenant->default_currency)) {
            $tenant->default_currency = $country->currency_code;
        }

        // Timezone: same rule — derive from country only when unset.
        if (empty($tenant->timezone)) {
            $tenant->timezone = $country->timezone;
        }
        // Locale: derive when unset.
        if (empty($tenant->default_locale)) {
            $tenant->default_locale = $country->default_locale;
        }
    }

    public function updating(Tenant $tenant): void
    {
        // If the operator changed `country_code` but NOT `currency_code`,
        // do NOT silently overwrite currency — that would corrupt existing
        // orders. The change is left for the operator (or a Filament admin
        // action) to make explicitly.
        if (! $tenant->isDirty('country_code')) {
            return;
        }

        // Normalise casing so the FK lookup never trips on lowercase.
        $tenant->country_code = strtoupper((string) $tenant->country_code);
    }

    private function findCountry(string $code): ?Country
    {
        if (array_key_exists($code, $this->countryCache)) {
            return $this->countryCache[$code];
        }

        // Wrap in try/catch so the observer is resilient when the
        // `countries` table doesn't yet exist (early test bootstrap, fresh
        // CI runs before all Phase-4 migrations have applied). Returning
        // null lets `creating()` keep its existing values, preserving
        // the legacy default-currency='UZS' behaviour from TenantFactory.
        try {
            return $this->countryCache[$code] = Country::query()->find($code);
        } catch (\Throwable $e) {
            return $this->countryCache[$code] = null;
        }
    }
}
