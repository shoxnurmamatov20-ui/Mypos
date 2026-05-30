import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@mypos/ui';
import { InventoryManager } from './_components/inventory-manager';

export async function generateMetadata() {
  const t = await getTranslations('inventory');
  return { title: `${t('title')} — MyPOS` };
}

export default async function InventoryPage() {
  const t = await getTranslations('inventory');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <InventoryManager />
    </div>
  );
}
