/**
 * Render a "today" / "yesterday" / fully-qualified date label for a
 * timestamp. Matches the orders list / cards in the mobile app.
 */

export type DateLocale = 'uz' | 'ru' | 'en';

export type RelativeDateLabels = {
  today: string;
  yesterday: string;
};

function localeToIntl(locale: DateLocale): string {
  switch (locale) {
    case 'uz':
      return 'uz-UZ';
    case 'ru':
      return 'ru-RU';
    case 'en':
      return 'en-US';
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatHHmm(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * "Bugun 14:32" / "Kecha 18:05" / "23 Mart, 12:00".
 * Falls back to ISO date if `iso` can't be parsed.
 */
export function formatRelativeDate(
  iso: string,
  locale: DateLocale,
  labels: RelativeDateLabels,
): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = formatHHmm(date);

  if (isSameDay(date, now)) {
    return `${labels.today} ${time}`;
  }
  if (isSameDay(date, yesterday)) {
    return `${labels.yesterday} ${time}`;
  }

  try {
    const fmt = new Intl.DateTimeFormat(localeToIntl(locale), {
      day: 'numeric',
      month: 'short',
    });
    return `${fmt.format(date)}, ${time}`;
  } catch {
    return `${date.toISOString().slice(0, 10)} ${time}`;
  }
}
