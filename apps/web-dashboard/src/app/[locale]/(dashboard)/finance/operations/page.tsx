import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { OperationsClient } from './operations-client';

export async function generateMetadata() {
  const t = await getTranslations('finance');
  return { title: `${t('operations.title')} — MyPOS` };
}

export default async function OperationsPage() {
  const t = await getTranslations('finance');
  return (
    <div className="space-y-6">
      <PageHeader title={t('operations.title')} description={t('operations.subtitle')} />
      <OperationsClient />
    </div>
  );
}
