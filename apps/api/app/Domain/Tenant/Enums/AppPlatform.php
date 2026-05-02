<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

/**
 * Phase 3 — target platform for a {@see \App\Domain\Tenant\Models\TenantApp}.
 *
 *   - Ios / Android: separate row per platform — usual case, distinct
 *     bundle/package IDs and divergent App Store / Play Store metadata.
 *   - Universal: a single row covering both platforms when bundle id and
 *     all assets are identical (rare; mostly internal-test scenarios).
 *
 * String values match the `platform` column in `tenant_apps` and the
 * EAS Build API's `platform` parameter ({"ios","android","all"}). Note
 * that `all` (the EAS wire value for cross-platform builds) corresponds
 * to our `Universal` case — the {@see self::easValue()} helper handles
 * the mapping so callers don't need to special-case it.
 */
enum AppPlatform: string
{
    case Ios = 'ios';
    case Android = 'android';
    case Universal = 'universal';

    public function label(): string
    {
        return match ($this) {
            self::Ios => 'iOS',
            self::Android => 'Android',
            self::Universal => 'Universal',
        };
    }

    /**
     * The string EAS Build expects in the dispatch payload.
     * EAS uses `all` (not `universal`) for cross-platform builds.
     */
    public function easValue(): string
    {
        return match ($this) {
            self::Ios => 'ios',
            self::Android => 'android',
            self::Universal => 'all',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $p): string => $p->value, self::cases());
    }
}
