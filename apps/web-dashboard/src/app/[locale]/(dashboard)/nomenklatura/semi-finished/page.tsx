import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { SemiProductsClient } from './semi-products-client';

export async function generateMetadata() {
  const t = await getTranslations('nomenklatura');
  return { title: `${t('semi.title')} — MyPOS` };
}

export default async function SemiFinishedPage() {
  const t = await getTranslations('nomenklatura');
  return (
    <div className="space-y-6">
      <PageHeader title={t('semi.title')} description={t('semi.subtitle')} />
      <SemiProductsClient />
    </div>
  );
}
