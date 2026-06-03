import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { RestrictedGate } from '../_components/restricted-gate';
import { DevicesClient } from './devices-client';

export async function generateMetadata() {
  const t = await getTranslations('signage');
  return { title: `${t('devices.title')} — MyPOS` };
}

export default async function DevicesPage() {
  const t = await getTranslations('signage');
  return (
    <div className="space-y-6">
      <PageHeader title={t('devices.title')} description={t('devices.subtitle')} />
      <RestrictedGate>
        <DevicesClient />
      </RestrictedGate>
    </div>
  );
}
