import { getTranslations } from 'next-intl/server';
import { MenuCategoriesClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('menu_categories')} — MyPOS` };
}

export default async function MenuCategoriesPage() {
  return <MenuCategoriesClient />;
}
