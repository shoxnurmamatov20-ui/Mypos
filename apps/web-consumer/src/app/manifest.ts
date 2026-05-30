/**
 * Per-tenant PWA manifest.
 *
 * Next.js serves this at `/manifest.webmanifest` automatically. The function
 * runs server-side on every request, so it can read the request's
 * `Host` header and emit a manifest tailored to the current tenant.
 *
 * Why dynamic?
 *   When a user installs the PWA from `jomeburger.uz`, the OS expects the
 *   install prompt + home-screen icon + colors to belong to *Jome Burger*,
 *   not MyPOS. Static `manifest.json` can't deliver that.
 *
 * The route is excluded from the middleware matcher (it's a `.*\\..*` URL),
 * so we re-resolve the host here. Cost is bounded — manifests are
 * fetched once per install.
 */

import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';
import { fetchBrandForHost } from '@/lib/brand';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const tenant = await fetchBrandForHost(host);

  // Marketplace fallback — same shape as the old static manifest.
  if (!tenant) {
    return {
      name: 'MyPOS — Restoranlar onlayn',
      short_name: 'MyPOS',
      description: 'Mazali ovqatlar 30 daqiqada eshigingizda',
      start_url: '/',
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#EA7C69',
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'uz',
      dir: 'ltr',
      categories: ['food', 'lifestyle', 'shopping'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        {
          src: '/icons/icon-192-maskable.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/icons/icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      prefer_related_applications: false,
    };
  }

  // Tenant-branded manifest.
  const { brand, name, short_name } = tenant;
  const tenantName = typeof name === 'string' ? name : (name.uz ?? name.ru ?? name.en ?? 'Restaurant');
  const tagline =
    brand.tagline?.uz ?? brand.tagline?.ru ?? brand.tagline?.en ?? 'Online buyurtma';
  const icon192 = brand.logo_url ?? '/icons/icon-192.png';
  const icon512 = brand.logo_url ?? '/icons/icon-512.png';

  return {
    name: tenantName,
    short_name: short_name ?? tenantName.slice(0, 12),
    description: tagline,
    start_url: '/',
    display: 'standalone',
    background_color: brand.background_color,
    theme_color: brand.primary_color,
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'uz',
    dir: 'ltr',
    categories: ['food', 'lifestyle'],
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    prefer_related_applications: false,
  };
}
