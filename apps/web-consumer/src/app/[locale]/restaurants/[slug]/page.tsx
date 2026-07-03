import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { RestaurantDetail } from '@/components/restaurant/restaurant-detail';
import { routing } from '@/i18n/routing';
import {
  isPublicLocale,
  PublicApiError,
  pickTranslation,
  publicConsumerApi,
} from '@/lib/public-api';
import { publicMenuToUi, publicRestaurantToUi } from '@/lib/public-api-mappers';

/** Pre-render top restaurants for SEO + ISR for the rest. */
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const response = await publicConsumerApi.restaurants.list({
      sort: 'popular',
      per_page: 32,
    });
    return response.data.flatMap((r) =>
      routing.locales.map((locale) => ({ locale, slug: r.slug })),
    );
  } catch {
    // If the API isn't reachable at build time, fall back to ISR-only.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isPublicLocale(locale)) return {};

  try {
    const { data: restaurant } = await publicConsumerApi.restaurants.bySlug(slug, { locale });
    const name = pickTranslation(restaurant.name, locale);
    const cuisine = pickTranslation(restaurant.cuisine_label, locale);
    return {
      title: `${name} — MyPOS`,
      description: `${name} • ${cuisine} • ${restaurant.delivery_minutes} min`,
      openGraph: {
        title: name,
        description: `${cuisine} • ${restaurant.delivery_minutes} min`,
        images: restaurant.cover_url ? [{ url: restaurant.cover_url }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isPublicLocale(locale)) notFound();
  setRequestLocale(locale);

  let menuResponse: Awaited<ReturnType<typeof publicConsumerApi.menu.bySlug>>;
  let restaurant: Awaited<ReturnType<typeof publicConsumerApi.menu.bySlug>>['data']['restaurant'];
  try {
    // Single fetch — the menu endpoint embeds the restaurant header so we
    // don't pay for two round-trips on every page view.
    menuResponse = await publicConsumerApi.menu.bySlug(slug, { locale });
    restaurant = menuResponse.data.restaurant;
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const uiRestaurant = publicRestaurantToUi(restaurant, locale);
  const uiMenu = publicMenuToUi(menuResponse);

  return <RestaurantDetail restaurant={uiRestaurant} menu={uiMenu} locale={locale} />;
}
