import { getTranslations } from 'next-intl/server';
import { TableCategoriesClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('table_categories')} — MyPOS` };
}

export default async function TableCategoriesPage() {
  return <TableCategoriesClient />;
}
