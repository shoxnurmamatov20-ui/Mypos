import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { CategoryManager } from '../_components/category-manager';

export async function generateMetadata() {
  const t = await getTranslations('finance');
  return { title: `${t('categories.expense_title')} — MyPOS` };
}

export default async function ExpenseCategoriesPage() {
  const t = await getTranslations('finance');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('categories.expense_title')}
        description={t('categories.expense_subtitle')}
      />
      <CategoryManager kind="expense" />
    </div>
  );
}
