/**
 * Date helpers — everything in Asia/Tashkent timezone.
 */

export const UZ_TIMEZONE = 'Asia/Tashkent';

export function formatDate(date: Date, locale: 'uz' | 'ru' | 'en' = 'uz'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: UZ_TIMEZONE,
  }).format(date);
}

export function formatDateTime(date: Date, locale: 'uz' | 'ru' | 'en' = 'uz'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UZ_TIMEZONE,
    hour12: false,
  }).format(date);
}

export function formatTime(date: Date, locale: 'uz' | 'ru' | 'en' = 'uz'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UZ_TIMEZONE,
    hour12: false,
  }).format(date);
}

/** Minutes elapsed between two dates (for "order age") */
export function minutesSince(date: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - date.getTime()) / 60_000);
}

/** Today's start (midnight) in Tashkent */
export function startOfToday(): Date {
  const now = new Date();
  const uzDate = new Date(
    now.toLocaleString('en-US', { timeZone: UZ_TIMEZONE }),
  );
  uzDate.setHours(0, 0, 0, 0);
  return uzDate;
}

function intlLocale(locale: 'uz' | 'ru' | 'en'): string {
  return locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
}
