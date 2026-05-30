import { setRequestLocale } from 'next-intl/server';
import { ShiftView } from '@/components/waiter/shift-view';

export default async function ShiftPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ShiftView />;
}
