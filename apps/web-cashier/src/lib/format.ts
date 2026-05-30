import type { AppLocale } from '@/i18n/routing';

/**
 * A name translated into every supported locale. Backend menu/category
 * resources serialise names this way; mock fixtures match the shape.
 */
export type LocalizedName = {
  uz: string;
  ru: string;
  en: string;
  kz?: string;
};

/** Pick the best string for the active locale, falling back uz → ru → en. */
export function pickName(name: LocalizedName, locale: string): string {
  if (locale === 'ru') return name.ru;
  if (locale === 'en') return name.en;
  if (locale === 'kz') return name.kz ?? name.ru;
  return name.uz;
}

/**
 * Format a so'm amount with thin-space thousands separators. The cashier
 * panel keeps money as whole so'm (no minor units) — simple to read on a
 * busy register.
 */
export function formatMoney(amount: number, currency = "so'm"): string {
  const rounded = Math.round(amount);
  const grouped = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} ${currency}`;
}

/** `HH:MM` in the browser's locale, 24-hour. */
export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** `DD.MM.YYYY` for shift history rows. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Minutes → `Ns Nm` style duration. Used by the shift screen. */
export function formatDuration(totalMinutes: number, locale: AppLocale = 'uz'): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  const hLabel = locale === 'ru' ? 'ч' : locale === 'en' ? 'h' : 'soat';
  const mLabel = locale === 'ru' ? 'мин' : locale === 'en' ? 'min' : 'daq';
  if (hours === 0) return `${minutes} ${mLabel}`;
  if (minutes === 0) return `${hours} ${hLabel}`;
  return `${hours} ${hLabel} ${minutes} ${mLabel}`;
}

/** Minutes elapsed since an ISO timestamp (0 if invalid / future). */
export function minutesSince(iso: string | null): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 60000));
}
