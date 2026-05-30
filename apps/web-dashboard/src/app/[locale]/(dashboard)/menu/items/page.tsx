import { getTranslations } from 'next-intl/server';
import { MenuItemsClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('menu_items')} — MyPOS` };
}

export default async function MenuItemsPage() {
  return <MenuItemsClient />;
}
