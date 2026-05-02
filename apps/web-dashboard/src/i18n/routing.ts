import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Phase 4: Qazaq (kz) added; ky/tg slated for future phases.
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'uz',
});
