import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { ProfileClient } from './profile-client';

export async function generateMetadata() {
  const t = await getTranslations('settings');
  return { title: `${t('profile.title')} — MyPOS` };
}

export default async function ProfileSettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-6">
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />
      <ProfileClient />
    </div>
  );
}
