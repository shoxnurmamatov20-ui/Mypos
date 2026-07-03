import { setRequestLocale } from 'next-intl/server';
import { TablesView } from '@/components/waiter/tables-view';

export default async function TablesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TablesView />;
}
