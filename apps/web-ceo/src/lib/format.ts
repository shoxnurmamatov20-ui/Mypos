/**
 * Display helpers for the CEO panel.
 *
 * Money values arrive from the API as integer minor units (tiyin) — the
 * CEO panel is denominated in UZS, so the compact helper renders e.g.
 * `2.4M so'm` from `245000000`. We keep a plain-number helper for counts
 * and a percentage helper for rates / trend deltas.
 */

const RU_LOCALE = 'ru-RU';

/** Render a number with thousand separators (uses non-breaking spaces). */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString(RU_LOCALE).replace(/,/g, ' ');
}

/** Compact number, e.g. `12.4K`, `3.2M`. Useful for KPI tiles. */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(0)}K`;
  return formatNumber(value);
}

/** Compact UZS from integer minor units, e.g. `2.4M so'm`, `850K so'm`. */
export function formatCompactUZS(amountMinor: number): string {
  if (amountMinor >= 1_000_000_000) return `${(amountMinor / 1_000_000_000).toFixed(1)}B so'm`;
  if (amountMinor >= 1_000_000) return `${(amountMinor / 1_000_000).toFixed(1)}M so'm`;
  if (amountMinor >= 1_000) return `${(amountMinor / 1_000).toFixed(0)}K so'm`;
  return `${formatNumber(amountMinor)} so'm`;
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
