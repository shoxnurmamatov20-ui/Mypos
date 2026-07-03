'use client';

import { motion } from 'framer-motion';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { RestaurantCard } from '@/components/restaurant/restaurant-card';
import { RestaurantCardSkeleton } from '@/components/ui/skeleton';
import { usePublicRestaurants } from '@/lib/hooks/use-public-restaurants';
import { isPublicLocale } from '@/lib/public-api';
import { publicRestaurantsToUi } from '@/lib/public-api-mappers';

const FEATURED_LIMIT = 8;

/**
 * Mobile: horizontal snap-scroll. Desktop: 4-col grid.
 *
 * Pulls the most popular restaurants from `/api/v1/public/restaurants?sort=popular`.
 * The mapper translates the API rows into the legacy `Restaurant` UI shape
 * so the card component can stay untouched.
 */
export function FeaturedRestaurants() {
  const t = useTranslations('home');
  const localeRaw = useLocale();
  const locale = isPublicLocale(localeRaw) ? localeRaw : 'uz';
  const allHref = `/${locale}/search` as Route;

  const { data, isLoading, isError } = usePublicRestaurants({
    sort: 'popular',
    per_page: FEATURED_LIMIT,
  });

  const featured = useMemo(
    () => publicRestaurantsToUi(data?.data ?? [], locale),
    [data?.data, locale],
  );

  const labels = {
    minutes: t('delivery_minutes', { minutes: '{minutes}' }),
    free: t('delivery_free'),
    closed: t('closed'),
    soum: locale === 'ru' ? 'сум' : "so'm",
  };

  return (
    <section className="py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold text-neutral-900 lg:text-4xl">
            {t('featured_title')}
          </h2>
          <Link
            href={allHref}
            className="hidden text-sm font-bold text-brand-500 transition hover:text-brand-600 md:inline-block"
          >
            {t('see_all')} →
          </Link>
        </div>

        {isLoading ? (
          <FeaturedSkeleton />
        ) : isError ? (
          <FeaturedError message={t('featured_error') /* see i18n note */} />
        ) : featured.length === 0 ? null : (
          <>
            {/* Mobile: snap row. Hidden on lg+. */}
            <div className="mt-8 -mx-4 overflow-x-auto pb-4 lg:hidden">
              <ul className="flex snap-x snap-mandatory gap-4 px-4">
                {featured.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                  >
                    <RestaurantCard
                      restaurant={r}
                      variant="horizontal"
                      locale={locale}
                      labels={labels}
                    />
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Desktop: 4-col grid. */}
            <ul className="mt-8 hidden gap-6 lg:grid lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((r, i) => (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                >
                  <RestaurantCard
                    restaurant={r}
                    variant="vertical"
                    locale={locale}
                    labels={labels}
                  />
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <li key={i}>
          <RestaurantCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

function FeaturedError({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        ⚠️
      </p>
      <p className="mt-3 text-sm text-neutral-500">{message}</p>
    </div>
  );
}
