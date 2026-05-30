import { setRequestLocale } from 'next-intl/server';
import { MenuView } from '@/components/waiter/menu-view';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MenuView />;
}
