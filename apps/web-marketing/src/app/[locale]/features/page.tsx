import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { HowItWorks } from '@/components/landing/how-it-works';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'features_page' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'features_page' });

  return (
    <>
      <section className="bg-parchment py-section">
        <div className="mx-auto max-w-3xl px-md text-center">
          <h1 className="font-display font-semibold text-display-md text-ink">{t('title')}</h1>
          <p className="mt-md font-display text-lead text-ink-muted-80">{t('subtitle')}</p>
        </div>
      </section>
      <FeaturesGrid />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
