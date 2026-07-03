import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RestaurantsGrid } from '@/components/restaurant/restaurants-grid';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'restaurants_page' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function RestaurantsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'restaurants_page' });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold text-neutral-900 lg:text-5xl">
          {t('title')}
        </h1>
        <p className="text-lg text-neutral-600">{t('subtitle')}</p>
      </header>

      <RestaurantsGrid />
    </div>
  );
}
