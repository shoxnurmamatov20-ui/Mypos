/**
 * Edge middleware — combines next-intl routing with custom-domain detection.
 *
 * Order of operations on every request:
 *
 *   1.  Inspect the `Host` header.
 *   2.  If it's one of *our* domains (`mypos.uz`, `*.mypos.uz`, dev hosts)
 *       → fast-path through next-intl's locale router unchanged.
 *   3.  Otherwise (custom tenant domain) → call the public
 *       `/api/v1/public/resolve-domain` endpoint.
 *       3a. If resolution succeeds → continue to the locale router and
 *           attach `x-tenant-slug` / `x-tenant-theme` to the response
 *           (handy for observability / debugging).
 *       3b. If resolution fails (unknown / unverified domain) → rewrite to
 *           `/{defaultLocale}/not-configured` so the visitor gets a
 *           friendly explanation instead of a stack trace.
 *
 * Why do this in middleware and *also* in the layout?
 *   - Middleware runs on every request edge-side: cheap and great for
 *     redirects/rewrites. But Edge can't render React, so the layout
 *     still has to fetch the brand to render the page.
 *   - Both calls hit the same Next.js edge fetch cache (60s, tagged on
 *     `brand:{host}`), so the layout call is effectively free.
 *
 * Caveat — the middleware fetch happens on every navigation. We rely on
 * Next.js's automatic edge-fetch caching (60s) to amortise this; the
 * resolver endpoint also serves a strong `Cache-Control: max-age=60`.
 */

import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { isOwnDomain } from './lib/brand';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Edge-cached resolve. We accept the slim envelope the middleware needs;
 * the layout will re-fetch the full brand row when rendering. The shape
 * below is intentionally a subset of `ResolveDomainResponse`.
 */
type SlimResolve = {
  data: {
    slug: string;
    brand: { theme: string };
  };
};

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';

async function resolveTenantSlug(host: string): Promise<{ slug: string; theme: string } | null> {
  try {
    const r = await fetch(
      `${INTERNAL_API_URL}/api/v1/public/resolve-domain?host=${encodeURIComponent(host)}`,
      {
        headers: { Accept: 'application/json' },
        // Edge fetch cache — Next will dedupe identical concurrent calls
        // and respect the upstream `Cache-Control` header.
        next: { revalidate: 60, tags: [`brand:${host}`] },
      },
    );
    if (!r.ok) return null;
    const json = (await r.json()) as SlimResolve;
    if (!json.data?.slug) return null;
    return { slug: json.data.slug, theme: json.data.brand?.theme ?? 'modern' };
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') ?? '';

  // Marketplace + dev → straight through next-intl.
  if (isOwnDomain(host)) {
    return intlMiddleware(request);
  }

  // Tenant custom domain — resolve, then route.
  const tenant = await resolveTenantSlug(host);

  if (!tenant) {
    // Unknown / un-verified domain. We rewrite (not redirect) so the URL
    // bar still shows the visitor's expected hostname; this avoids the
    // "why am I on mypos.uz now?" confusion. The fallback page lives
    // under the default locale so it inherits the root layout and i18n.
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}/not-configured`;
    return NextResponse.rewrite(url);
  }

  // Run the locale-router and surface tenant info as RESPONSE headers
  // (useful for downstream observability / debugging — the layout
  // re-resolves the brand from the original `Host` header on its own).
  const response = intlMiddleware(request);
  response.headers.set('x-tenant-slug', tenant.slug);
  response.headers.set('x-tenant-theme', tenant.theme);
  return response;
}

export const config = {
  // Same matcher as before — skip API routes & static assets.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
