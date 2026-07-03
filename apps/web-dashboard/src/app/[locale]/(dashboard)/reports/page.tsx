import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { ReportsManager } from './_components/reports-manager';

export async function generateMetadata() {
  const t = await getTranslations('reports');
  return { title: `${t('title')} — MyPOS` };
}

export default async function ReportsPage() {
  const t = await getTranslations('reports');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <ReportsManager />
    </div>
  );
}
