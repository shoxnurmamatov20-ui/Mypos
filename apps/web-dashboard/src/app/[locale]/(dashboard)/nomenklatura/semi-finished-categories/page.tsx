import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { NomCategoryManager } from '../_components/nom-category-manager';

export async function generateMetadata() {
  const t = await getTranslations('nomenklatura');
  return { title: `${t('semi_categories.title')} — MyPOS` };
}

export default async function SemiFinishedCategoriesPage() {
  const t = await getTranslations('nomenklatura');
  return (
    <div className="space-y-6">
      <PageHeader title={t('semi_categories.title')} description={t('semi_categories.subtitle')} />
      <NomCategoryManager kind="semi" />
    </div>
  );
}
