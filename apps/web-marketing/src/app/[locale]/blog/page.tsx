import { Newspaper } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog_page' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog_page' });

  return (
    <>
      <section className="bg-gradient-to-br from-brand-50 via-white to-mint-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">{t('subtitle')}</p>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 px-4 py-16 text-center sm:px-6">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Newspaper className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-neutral-900">
            {t('coming_soon')}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{t('coming_soon_desc')}</p>
        </div>
      </section>
    </>
  );
}
