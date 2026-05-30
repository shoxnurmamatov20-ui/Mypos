import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PricingTable } from '@/components/landing/pricing-table';
import { Testimonials } from '@/components/landing/testimonials';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <PricingTable />
      <CtaSection />
    </>
  );
}
