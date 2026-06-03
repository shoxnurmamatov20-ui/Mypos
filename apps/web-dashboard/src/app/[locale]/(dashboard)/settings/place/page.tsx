import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { PlaceClient } from './place-client';

export async function generateMetadata() {
  const t = await getTranslations('settings');
  return { title: `${t('place.title')} — MyPOS` };
}

export default async function PlaceSettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-6">
      <PageHeader title={t('place.title')} description={t('place.subtitle')} />
      <PlaceClient />
    </div>
  );
}
