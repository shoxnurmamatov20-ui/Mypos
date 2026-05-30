import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@mypos/ui';
import { MenuManager } from './_components/menu-manager';

export async function generateMetadata() {
  const t = await getTranslations('menu');
  return { title: `${t('title')} — MyPOS` };
}

export default async function MenuPage() {
  const t = await getTranslations('menu');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <MenuManager />
    </div>
  );
}
