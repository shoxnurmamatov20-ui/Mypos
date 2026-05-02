import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { Faq } from '@/components/landing/faq';
import { PricingTable } from '@/components/landing/pricing-table';
import { RoiCalculator } from '@/components/landing/roi-calculator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing_page' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pricing_page' });

  return (
    <>
      <section className="bg-parchment py-section">
        <div className="mx-auto max-w-3xl px-md text-center">
          <h1 className="font-display font-semibold text-display-md text-ink">{t('title')}</h1>
          <p className="mt-md font-display text-lead text-ink-muted-80">{t('subtitle')}</p>
        </div>
      </section>
      <PricingTable />
      <RoiCalculator />
      <Faq />
      <CtaSection />
    </>
  );
}
