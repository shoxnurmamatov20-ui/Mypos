import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { GetStartedFlow } from '@/components/landing/get-started-flow';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Bepul boshlash — MyPOS',
  description:
    'MyPOS bilan 5 daqiqada ishga tushiring. 14 kun bepul · Karta kerak emas · Toshkent + 11 viloyat.',
  robots: { index: false, follow: true },
};

export default async function GetStartedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-[#001B1B]">
      <GetStartedFlow locale={locale} />
    </main>
  );
}
