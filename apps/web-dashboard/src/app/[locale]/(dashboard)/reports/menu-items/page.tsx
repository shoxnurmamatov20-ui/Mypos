import { getTranslations } from 'next-intl/server';
import { MenuItemsReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('menu_items_report')} — MyPOS` };
}

export default async function MenuItemsReportPage() {
  return <MenuItemsReportView />;
}
