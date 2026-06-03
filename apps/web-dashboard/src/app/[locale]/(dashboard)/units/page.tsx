import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { UnitsManager } from './_components/units-manager';

export async function generateMetadata() {
  const t = await getTranslations('units');
  return { title: `${t('title')} — MyPOS` };
}

export default async function UnitsPage() {
  const t = await getTranslations('units');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <UnitsManager />
    </div>
  );
}
