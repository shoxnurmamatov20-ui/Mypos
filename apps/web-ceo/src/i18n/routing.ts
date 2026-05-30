import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uz', 'ru', 'en', 'kz'] as const,
  defaultLocale: 'uz',
  // `as-needed`: the default locale (`uz`) is served without a `/uz` prefix.
  // So `/dashboard/complaints` and `/uz/dashboard/complaints` both resolve.
  // RU/EN/KZ still require their prefix.
  localePrefix: 'as-needed',
});
