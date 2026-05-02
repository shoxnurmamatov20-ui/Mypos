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
      <section className="bg-parchment py-section">
        <div className="mx-auto max-w-3xl px-md text-center">
          <h1 className="font-display font-semibold text-display-md text-ink">{t('title')}</h1>
          <p className="mt-md font-display text-lead text-ink-muted-80">{t('subtitle')}</p>
        </div>
      </section>

      <section className="bg-canvas py-section">
        <div className="mx-auto max-w-2xl rounded-card border border-dashed border-hairline-soft bg-parchment px-md py-xl text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-pearl bg-coral-tint text-coral">
            <Newspaper className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-md font-display font-semibold text-title text-ink">
            {t('coming_soon')}
          </h2>
          <p className="mt-xs text-caption text-ink-muted-80">{t('coming_soon_desc')}</p>
        </div>
      </section>
    </>
  );
}
