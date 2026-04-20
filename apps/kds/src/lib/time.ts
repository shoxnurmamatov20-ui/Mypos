/**
 * Time utilities for KDS — Uzbek-first formatting.
 * Kitchen staff need quick visual cues for order age and urgency.
 */

export type UrgencyLevel = 'normal' | 'warning' | 'urgent';

/**
 * Compute integer minutes elapsed since an ISO-8601 timestamp.
 * Returns 0 if `iso` is falsy or unparsable.
 */
export function minutesSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 0;
  const diffMs = Date.now() - ts;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60_000);
}

/**
 * Human-readable Uzbek elapsed label.
 *   0     -> "hozir"
 *   1..59 -> "N daq"
 *   60+   -> "N soat" (or "N soat M daq" when >= 60 and has minutes)
 */
export function formatTimeAgo(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'hozir';
  if (minutes < 60) return `${minutes} daq`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} soat`;
  return `${hours} soat ${mins} daq`;
}

/**
 * Urgency buckets for color coding:
 *   < 5 min       -> normal
 *   5..15 min     -> warning
 *   > 15 min      -> urgent
 */
export function urgencyLevel(minutes: number): UrgencyLevel {
  if (minutes < 5) return 'normal';
  if (minutes <= 15) return 'warning';
  return 'urgent';
}
