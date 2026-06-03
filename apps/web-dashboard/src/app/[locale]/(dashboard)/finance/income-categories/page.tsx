import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { CategoryManager } from '../_components/category-manager';

export async function generateMetadata() {
  const t = await getTranslations('finance');
  return { title: `${t('categories.income_title')} — MyPOS` };
}

export default async function IncomeCategoriesPage() {
  const t = await getTranslations('finance');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('categories.income_title')}
        description={t('categories.income_subtitle')}
      />
      <CategoryManager kind="income" />
    </div>
  );
}
