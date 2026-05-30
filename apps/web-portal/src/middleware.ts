import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'uz',
  localePrefix: 'always',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
