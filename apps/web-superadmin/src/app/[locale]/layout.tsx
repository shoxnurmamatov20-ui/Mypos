import { AnalyticsBoot } from '@mypos/analytics';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { AuthGate } from '@/components/auth/auth-gate';
import { Providers } from '@/components/providers';
import { routing } from '@/i18n/routing';
import './globals.css';

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

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MyPOS Admin',
    template: '%s — MyPOS Admin',
  },
  description: 'MyPOS SaaS administration panel',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
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

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${manrope.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-white text-[#16221f] dark:bg-[#0b1120] dark:text-[#e2e8f0] font-sans antialiased">
        <AnalyticsBoot app="web-superadmin" />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AuthGate>{children}</AuthGate>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
