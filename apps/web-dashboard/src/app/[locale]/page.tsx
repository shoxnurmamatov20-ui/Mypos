import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="font-display text-5xl font-bold text-brand-500">{t('title')}</h1>
      <p className="mt-4 text-neutral-600">{t('subtitle')}</p>
    </main>
  );
}
