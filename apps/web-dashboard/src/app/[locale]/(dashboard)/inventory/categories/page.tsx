import { getTranslations } from 'next-intl/server';
import { InventoryCategoriesClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('inventory_categories')} — MyPOS` };
}

export default async function InventoryCategoriesPage() {
  return <InventoryCategoriesClient />;
}
