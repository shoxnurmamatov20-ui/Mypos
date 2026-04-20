import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { Faq } from '@/components/landing/faq';
import { PricingTable } from '@/components/landing/pricing-table';

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
      <section className="bg-gradient-to-br from-brand-50 via-white to-mint-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">{t('subtitle')}</p>
        </div>
      </section>
      <PricingTable />
      <Faq />
      <CtaSection />
    </>
  );
}
