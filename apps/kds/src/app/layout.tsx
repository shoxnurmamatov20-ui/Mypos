import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'MyPOS Kitchen',
  description: 'Oshxona ekrani — buyurtmalarni boshqarish',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={`${inter.variable} ${manrope.variable} dark`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
