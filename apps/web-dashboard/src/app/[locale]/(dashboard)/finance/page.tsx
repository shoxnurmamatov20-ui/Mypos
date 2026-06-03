import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { OverviewClient } from './_components/overview-client';

export async function generateMetadata() {
  const t = await getTranslations('finance');
  return { title: `${t('overview.title')} — MyPOS` };
}

export default async function FinanceOverviewPage() {
  const t = await getTranslations('finance');
  return (
    <div className="space-y-6">
      <PageHeader title={t('overview.title')} description={t('overview.subtitle')} />
      <OverviewClient />
    </div>
  );
}
