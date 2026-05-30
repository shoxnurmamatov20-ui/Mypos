import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@mypos/ui';
import { DepartmentsManager } from './_components/departments-manager';

export async function generateMetadata() {
  const t = await getTranslations('departments');
  return { title: `${t('title')} — MyPOS` };
}

export default async function DepartmentsPage() {
  const t = await getTranslations('departments');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <DepartmentsManager />
    </div>
  );
}
