import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { generateRootTenantVars } from '@mypos/design-tokens/tenant';
import { CookieConsent } from '@/components/landing/cookie-consent';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { routing } from '@/i18n/routing';
import '../globals.css';

const SITE_URL = 'https://mypos.uz';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  const languages = Object.fromEntries(
    routing.locales.map((code) => [code, `${SITE_URL}/${code}`]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('title'),
      template: '%s · MyPOS',
    },
    description: t('description'),
    keywords: t('keywords'),
    applicationName: 'MyPOS',
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: 'MyPOS',
      title: t('og_title'),
      description: t('og_description'),
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('og_title'),
      description: t('og_description'),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
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

  return (
    <html lang={locale}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateRootTenantVars() }} />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas text-ink">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
