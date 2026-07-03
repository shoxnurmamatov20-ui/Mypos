import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { NomCategoryManager } from '../_components/nom-category-manager';

export async function generateMetadata() {
  const t = await getTranslations('nomenklatura');
  return { title: `${t('sales_categories.title')} — MyPOS` };
}

export default async function SalesCategoriesPage() {
  const t = await getTranslations('nomenklatura');
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sales_categories.title')}
        description={t('sales_categories.subtitle')}
      />
      <NomCategoryManager kind="sales" />
    </div>
  );
}
