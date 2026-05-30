/**
 * Tiny formatters used by inventory pages. Kept local so we don't pollute the
 * shared utils package with locale-specific behaviour.
 */

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(n: number, maxDigits = 3): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('uz', { maximumFractionDigits: maxDigits });
}

/** YYYY-MM-DD (today). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** YYYY-MM-DD N days ago. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** First day of current month, YYYY-MM-DD. */
export function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

/** Start of current ISO week (Mon), YYYY-MM-DD. */
export function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0..6, 0=Sun
  const diff = (day + 6) % 7; // shift to Mon=0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function isSameDay(iso: string | null, ref: Date = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}
