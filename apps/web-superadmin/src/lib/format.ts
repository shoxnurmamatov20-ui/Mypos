/**
 * Display helpers for the super-admin dashboard.
 *
 * Money values arrive from the API as integer minor units (tiyin) — most
 * SaaS metrics are denominated in UZS, so the helper renders e.g.
 * `2 450 000 so'm` from `245000000`. We keep a plain-number helper for
 * counts and a percentage helper for rates / churn.
 */

const RU_LOCALE = 'ru-RU';

/** Convert minor (tiyin) → major UZS (so'm) and format with thin spaces. */
export function formatUZS(amountMinor: number): string {
  const major = Math.round(amountMinor / 100);
  return `${formatNumber(major)} so'm`;
}

/** Render a number with thousand separators (uses non-breaking spaces). */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString(RU_LOCALE).replace(/,/g, ' ');
}

/**
 * Format a ratio as a percentage string. `digits` controls fraction digits;
 * `signed` prefixes a `+` for positive values (useful for trend deltas).
 */
export function formatPercent(
  value: number,
  options: { digits?: number; signed?: boolean } = {},
): string {
  const { digits = 1, signed = false } = options;
  const formatted = value.toFixed(digits);
  if (signed && value > 0) return `+${formatted}%`;
  return `${formatted}%`;
}

/** Compact representation, e.g. `12.4K`, `3.2M`. Useful for KPI tiles. */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return formatNumber(value);
}
