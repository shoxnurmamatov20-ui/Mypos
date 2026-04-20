import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const SITE_URL = 'https://mypos.uz';
const PATHS = ['', '/features', '/pricing', '/about', '/blog', '/contact'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routing.locales.flatMap((locale) =>
    PATHS.map((path) => {
      const url = `${SITE_URL}/${locale}${path}`;
      const alternates = Object.fromEntries(
        routing.locales.map((code) => [code, `${SITE_URL}/${code}${path}`]),
      );
      return {
        url,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: path === '' ? 1 : 0.7,
        alternates: { languages: alternates },
      };
    }),
  );
}
