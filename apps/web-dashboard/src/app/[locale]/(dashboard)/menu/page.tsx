import { getTranslations } from 'next-intl/server';
import { MenuManager } from './_components/menu-manager';

export async function generateMetadata() {
  const t = await getTranslations('menu');
  return { title: `${t('title')} — MyPOS` };
}

export default async function MenuPage() {
  const t = await getTranslations('menu');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
        </div>
      </header>
      <MenuManager />
    </div>
  );
}
