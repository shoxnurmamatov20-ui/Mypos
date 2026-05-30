import { defineRouting } from 'next-intl/routing';

/**
 * Cashier panel locales. Mirrors the rest of the MyPOS web apps:
 * uz (default), ru, en, kz.
 */
export const routing = defineRouting({
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'uz',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];
