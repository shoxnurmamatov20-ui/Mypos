'use client';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { RestaurantCard } from '@/components/restaurant/restaurant-card';
import { RestaurantCardSkeleton } from '@/components/ui/skeleton';
import { isPublicLocale } from '@/lib/public-api';
import { publicRestaurantsToUi } from '@/lib/public-api-mappers';
import { usePublicRestaurants } from '@/lib/hooks/use-public-restaurants';

const NEAR_YOU_LIMIT = 12;

/**
 * "Near you" rail. Asks the browser for a coarse location and forwards it
 * to the API as a `location=lat,lng` filter. If the user denies geolocation
 * we just fall through to the default ordering — the backend will rank by
 * popularity in that case.
 */
export function NearYou() {
  const t = useTranslations('home');
  const localeRaw = useLocale();
  const locale = isPublicLocale(localeRaw) ? localeRaw : 'uz';

  const location = useGeolocationOnce();

  const { data, isLoading, isError } = usePublicRestaurants({
    per_page: NEAR_YOU_LIMIT,
    location: location ?? undefined,
  });

  const items = useMemo(
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
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl font-extrabold text-neutral-900 lg:text-4xl">
            {t('near_you_title')}
          </h2>
          {!isLoading && data ? (
            <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">
              {t('near_you_count', { count: data.meta.total })}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
              <li key={i}>
                <RestaurantCardSkeleton />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="mt-8 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <p className="text-5xl" aria-hidden="true">
              ⚠️
            </p>
            <p className="mt-3 text-sm text-neutral-500">{t('near_you_error')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <p className="text-5xl" aria-hidden="true">
              📍
            </p>
            <p className="mt-3 text-sm text-neutral-500">{t('near_you_empty')}</p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: (i % 6) * 0.05 }}
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
        )}
      </div>
    </section>
  );
}

/**
 * Asks for the user's coarse location once on mount. Returns
 * `"lat,lng"` (rounded to 4 decimals) or `null` if they declined or the
 * browser doesn't support the API.
 */
function useGeolocationOnce(): string | null {
  const [coords, setCoords] = useState<string | null>(null);
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      },
      () => {
        // User denied / unavailable — fall through to default ordering.
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60_000 },
    );
  }, []);
  return coords;
}
