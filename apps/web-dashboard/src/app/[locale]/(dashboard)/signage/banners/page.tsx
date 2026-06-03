import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { BannersClient } from './banners-client';

export async function generateMetadata() {
  const t = await getTranslations('signage');
  return { title: `${t('banners.title')} — MyPOS` };
}

export default async function BannersPage() {
  const t = await getTranslations('signage');
  return (
    <div className="space-y-6">
      <PageHeader title={t('banners.title')} description={t('banners.subtitle')} />
      <BannersClient />
    </div>
  );
}
