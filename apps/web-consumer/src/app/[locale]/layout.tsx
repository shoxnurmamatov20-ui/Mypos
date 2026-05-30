import { AnalyticsBoot } from '@mypos/analytics';
import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { AuthGate } from '@/components/auth/auth-gate';
import { CookieConsent } from '@/components/layout/cookie-consent';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { Providers } from '@/components/providers';
import { BrandProvider } from '@/lib/brand-context';
import { brandToCssVars, fetchBrandForHost, MYPOS_DEFAULT_BRAND } from '@/lib/brand';
import { routing } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mypos.uz'),
  title: {
    default: 'MyPOS — Restoranlar onlayn',
    template: '%s — MyPOS',
  },
  description: 'Mazali ovqatlar, tezkor yetkazib berish',
  manifest: '/manifest.webmanifest',
  applicationName: 'MyPOS',
  appleWebApp: {
    capable: true,
    title: 'MyPOS',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'MyPOS',
    title: 'MyPOS — Restoranlar onlayn',
    description: 'Mazali ovqatlar 30 daqiqada eshigingizda',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyPOS — Restoranlar onlayn',
    description: 'Mazali ovqatlar 30 daqiqada eshigingizda',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#EA7C69',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  // Resolve brand from the request host. The middleware has already
  // confirmed the host either belongs to us (→ marketplace defaults) or
  // resolves to a verified tenant (→ this fetch hits the same edge cache
  // as the middleware did, so it's effectively free).
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const tenant = await fetchBrandForHost(host);
  const brand = tenant?.brand ?? MYPOS_DEFAULT_BRAND;

  // Inject brand colors as CSS variables on <html> so every utility
  // (`bg-brand-primary`, `text-brand-text`, …) resolves to tenant colors
  // without a class swap. Falls back to MyPOS defaults when no tenant.
  const cssVars = brandToCssVars(brand);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${manrope.variable}`}
      style={cssVars as React.CSSProperties}
      data-theme={brand.theme}
    >
      <head>
        {brand.favicon_url && brand.favicon_url !== '/favicon.ico' && (
          // Tenant-supplied favicon overrides the static one. Using a
          // raw <link> here (not Metadata.icons) lets us emit an
          // *absolute* CDN URL without rewriting the metadata API.
          <link rel="icon" href={brand.favicon_url} />
        )}
        {brand.custom_css && (
          // Plus-tier custom CSS. Backend has already sanitised it; we
          // inline rather than `<link>` so it lands in the same paint
          // as the variable injection (no flash of un-styled content).
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised server-side
          <style dangerouslySetInnerHTML={{ __html: brand.custom_css }} />
        )}
      </head>
      <body className="bg-brand-background font-sans text-brand-text antialiased">
        <AnalyticsBoot app="web-consumer" />
        <NextIntlClientProvider messages={messages}>
          <BrandProvider tenant={tenant} host={host}>
            <Providers>
              <AuthGate>
                <div className="flex min-h-screen flex-col pb-16 md:pb-0">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <MobileBottomNav />
                <CookieConsent />
              </AuthGate>
            </Providers>
          </BrandProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
