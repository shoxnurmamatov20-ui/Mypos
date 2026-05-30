import { getRequestConfig } from 'next-intl/server';

const locales = ['uz', 'ru', 'en', 'kz'] as const;
type Locale = (typeof locales)[number];

const defaultLocale: Locale = 'uz';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = (locales as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
