import { getTranslations } from 'next-intl/server';
import { InventoryManager } from './_components/inventory-manager';

export async function generateMetadata() {
  const t = await getTranslations('inventory');
  return { title: `${t('title')} — MyPOS` };
}

export default async function InventoryPage() {
  const t = await getTranslations('inventory');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
      </header>
      <InventoryManager />
    </div>
  );
}
