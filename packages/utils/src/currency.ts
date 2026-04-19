/**
 * Currency formatting helpers.
 *
 * Amounts are stored as **integer minor units** (tiyin for UZS, cents for USD, etc.)
 * to avoid floating-point rounding errors.
 *
 * UZS uses "so'm" as suffix with comma as thousand separator (common in UZ):
 *   1500 → "1,500 so'm"
 *
 * RU uses "сум" suffix with space:
 *   1500 → "1 500 сум"
 *
 * USD uses "$" prefix:
 *   1500 → "$15.00" (1500 cents → $15.00)
 */

export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB' | 'KZT' | 'TRY';
export type Locale = 'uz' | 'ru' | 'en';

const SUBUNIT_FACTOR: Record<Currency, number> = {
  UZS: 1,       // UZS tiyin is ignored in practice; 1 so'm = minimum
  USD: 100,
  EUR: 100,
  RUB: 100,
  KZT: 100,
  TRY: 100,
};

const CURRENCY_SUFFIX: Record<Currency, Record<Locale, string>> = {
  UZS: { uz: "so'm", ru: 'сум', en: 'UZS' },
  USD: { uz: 'USD', ru: 'USD', en: '$' },
  EUR: { uz: 'EUR', ru: '€', en: '€' },
  RUB: { uz: 'RUB', ru: '₽', en: 'RUB' },
  KZT: { uz: 'KZT', ru: '₸', en: 'KZT' },
  TRY: { uz: 'TRY', ru: '₺', en: '₺' },
};

export function formatMoney(
  minorAmount: number,
  currency: Currency = 'UZS',
  locale: Locale = 'uz',
): string {
  const factor = SUBUNIT_FACTOR[currency];
  const major = minorAmount / factor;

  const suffix = CURRENCY_SUFFIX[currency][locale];
  const thousandSep = locale === 'ru' ? ' ' : ',';

  if (currency === 'UZS') {
    // UZS doesn't show decimals
    const formatted = Math.floor(major)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    return `${formatted} ${suffix}`;
  }

  const fractionDigits = factor === 1 ? 0 : 2;
  const intl = new Intl.NumberFormat(localeToIntl(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${intl.format(major)} ${suffix}`;
}

/** UZS-only shortcut, most common in the codebase */
export function formatUZS(minorAmount: number, locale: Locale = 'uz'): string {
  return formatMoney(minorAmount, 'UZS', locale);
}

function localeToIntl(locale: Locale): string {
  switch (locale) {
    case 'uz':
      return 'uz-UZ';
    case 'ru':
      return 'ru-RU';
    case 'en':
      return 'en-US';
  }
}

/** Parse UZS string like "1,500 so'm" → 1500 */
export function parseUZS(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}
