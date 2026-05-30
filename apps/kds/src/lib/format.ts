/**
 * Display helpers for the Kitchen panel.
 *
 * Money values arrive from the API as integer minor units (tiyin). Most
 * MyPOS tenants are denominated in UZS, so the helper renders e.g.
 * `2 450 000 so'm` from `245000000`. Counts use thin-space grouping so
 * a 999-cover dinner rush still reads cleanly on a kitchen display.
 */

const RU_LOCALE = 'ru-RU';

/** Render a number with thousand separators (uses non-breaking spaces). */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString(RU_LOCALE).replace(/,/g, ' ');
}

/** Convert minor (tiyin) → major UZS (so'm) and format with thin spaces. */
export function formatUZS(amountMinor: number): string {
  const major = Math.round(amountMinor / 100);
  return `${formatNumber(major)} so'm`;
}

/** Compact representation, e.g. `12.4K`, `3.2M`. Useful for KPI tiles. */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return formatNumber(value);
}

/** `HH:MM` clock label from an ISO timestamp, in the local timezone. */
export function formatClockTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '—';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
