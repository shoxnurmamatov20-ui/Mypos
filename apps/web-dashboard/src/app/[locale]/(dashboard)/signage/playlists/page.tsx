import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { RestrictedGate } from '../_components/restricted-gate';
import { PlaylistsClient } from './playlists-client';

export async function generateMetadata() {
  const t = await getTranslations('signage');
  return { title: `${t('playlists.title')} — MyPOS` };
}

export default async function PlaylistsPage() {
  const t = await getTranslations('signage');
  return (
    <div className="space-y-6">
      <PageHeader title={t('playlists.title')} description={t('playlists.subtitle')} />
      <RestrictedGate>
        <PlaylistsClient />
      </RestrictedGate>
    </div>
  );
}
