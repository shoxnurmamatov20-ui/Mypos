import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { routing } from '@/i18n/routing';
import { Providers } from './providers';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-display' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default async function RootLayout({
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
    <html lang={locale} className={`${inter.variable} ${manrope.variable} ${mono.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
