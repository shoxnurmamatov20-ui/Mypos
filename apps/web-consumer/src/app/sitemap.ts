import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { publicConsumerApi } from '@/lib/public-api';

const SITE_URL = 'https://mypos.uz';

const STATIC_PATHS = [
  '',
  '/restaurants',
  '/search',
  '/login',
  '/register',
  '/forgot-password',
] as const;

/**
 * Build a fully-localised sitemap including the top public restaurants.
 *
 * Fetches at build time (or on revalidate). If the API isn't reachable
 * — e.g. during a partial build — we fall back to the static paths so
 * the sitemap is always valid.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let restaurantPaths: string[] = [];

  try {
    const response = await publicConsumerApi.restaurants.list({
      sort: 'popular',
      per_page: 100,
    });
    restaurantPaths = response.data.map((r) => `/restaurants/${r.slug}`);
  } catch {
    // Network / build-time failure — emit static paths only.
  }

  const allPaths = [...STATIC_PATHS, ...restaurantPaths];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of allPaths) {
      const alternates = Object.fromEntries(
        routing.locales.map((code) => [code, `${SITE_URL}/${code}${path}`]),
      );

      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1.0 : path.startsWith('/restaurants/') ? 0.8 : 0.7,
        alternates: { languages: alternates },
      });
    }
  }

  return entries;
}
