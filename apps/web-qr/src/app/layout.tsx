import { AnalyticsBoot } from '@mypos/analytics';
import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Providers } from './providers';
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

export const metadata: Metadata = {
  title: 'MyPOS Menu',
  description: "Restoran menyusi — QR kodni skanerlab ko'ring",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'MyPOS Menu',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#EA7C69',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <AnalyticsBoot app="web-qr" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
