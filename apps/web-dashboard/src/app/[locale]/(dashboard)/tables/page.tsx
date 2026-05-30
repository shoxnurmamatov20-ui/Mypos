import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@mypos/ui';
import { TablesManager } from './_components/tables-manager';

export async function generateMetadata() {
  const t = await getTranslations('tables');
  return { title: `${t('title')} — MyPOS` };
}

export default async function TablesPage() {
  const t = await getTranslations('tables');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <TablesManager />
    </div>
  );
}
