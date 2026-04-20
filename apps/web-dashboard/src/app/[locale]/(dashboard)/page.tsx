import { getTranslations } from 'next-intl/server';
import { DashboardOverview } from './_components/dashboard-overview';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('dashboard')} — MyPOS` };
}

export default async function HomePage() {
  const t = await getTranslations('nav');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900">{t('dashboard')}</h1>
      </header>
      <DashboardOverview />
    </div>
  );
}
