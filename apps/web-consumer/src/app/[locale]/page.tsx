import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppCta } from '@/components/home/app-cta';
import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedRestaurants } from '@/components/home/featured-restaurants';
import { HeroSection } from '@/components/home/hero-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { NearYou } from '@/components/home/near-you';
import { PromoBanner } from '@/components/home/promo-banner';
import { TenantThemeShell } from '@/components/themes/TenantThemeShell';
import { fetchBrandForHost } from '@/lib/brand';
import {
  isPublicLocale,
  type PublicLocale,
  type PublicRestaurant,
  publicConsumerApi,
} from '@/lib/public-api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const tenant = await fetchBrandForHost(host);

  if (tenant) {
    const tenantName =
      typeof tenant.name === 'string' ? tenant.name : (tenant.name.uz ?? 'Restaurant');
    const tagline =
      tenant.brand.tagline?.uz ?? tenant.brand.tagline?.ru ?? tenant.brand.tagline?.en ?? '';
    return {
      title: tenantName,
      description: tagline,
      openGraph: {
        title: tenantName,
        description: tagline,
        ...(tenant.brand.og_image_url ? { images: [tenant.brand.og_image_url] } : {}),
      },
    };
  }

  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const tenant = await fetchBrandForHost(host);

  // ---- Marketplace mode (mypos.uz) -------------------------------
  if (!tenant) {
    return (
      <>
        <HeroSection />
        <CategoryGrid />
        <FeaturedRestaurants />
        <PromoBanner />
        <NearYou />
        <HowItWorks />
        <AppCta />
      </>
    );
  }

  // ---- Tenant mode (jomeburger.uz) -------------------------------
  // Fetch the tenant's restaurant payload once so the theme template
  // can deep-link into the right slug. Failure here is non-fatal —
  // we render with `restaurant: null` and let the theme handle it.
  const safeLocale: PublicLocale = isPublicLocale(locale) ? locale : 'uz';
  let restaurant: PublicRestaurant | null = null;
  try {
    const r = await publicConsumerApi.restaurants.bySlug(tenant.slug, {
      locale: safeLocale,
    });
    restaurant = r.data;
  } catch {
    restaurant = null;
  }

  return (
    <TenantThemeShell
      tenant={tenant}
      brand={tenant.brand}
      restaurant={restaurant}
      locale={safeLocale}
    />
  );
}
