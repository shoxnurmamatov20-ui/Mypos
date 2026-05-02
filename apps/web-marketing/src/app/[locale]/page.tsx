import { setRequestLocale } from 'next-intl/server';
import { CaseStudies } from '@/components/landing/case-studies';
import { Comparison } from '@/components/landing/comparison';
import { CtaSection } from '@/components/landing/cta-section';
import { CustomerLogos } from '@/components/landing/customer-logos';
import { Faq } from '@/components/landing/faq';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PricingTable } from '@/components/landing/pricing-table';
import { RoiCalculator } from '@/components/landing/roi-calculator';
import { SolutionsGrid } from '@/components/landing/solutions-grid';
import { Testimonials } from '@/components/landing/testimonials';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <CustomerLogos />
      <FeaturesGrid />
      <SolutionsGrid />
      <HowItWorks />
      <PricingTable />
      <Comparison />
      <RoiCalculator />
      <Testimonials />
      <CaseStudies />
      <Faq />
      <CtaSection />
    </>
  );
}
