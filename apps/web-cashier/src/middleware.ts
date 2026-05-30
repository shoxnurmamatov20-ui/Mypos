import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * next-intl locale negotiation. Redirects locale-less paths (`/`, `/pos`) to
 * the prefixed equivalent (`/uz`, `/uz/pos`) and validates the locale segment.
 */
export default createMiddleware(routing);

export const config = {
  // Run on every path except Next internals, the API proxy and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
