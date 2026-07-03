'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { RestaurantCardSkeleton } from '@/components/ui/skeleton';
import type { CategoryId, Restaurant } from '@/data/restaurants';
import { usePublicRestaurants } from '@/lib/hooks/use-public-restaurants';
import { isPublicLocale, type PublicCuisine } from '@/lib/public-api';
import { publicRestaurantsToUi } from '@/lib/public-api-mappers';
import { CuisineFilterChips } from './cuisine-filter-chips';
import { RestaurantCard } from './restaurant-card';
import { SortDropdown, type SortKey } from './sort-dropdown';

/**
 * Server-driven restaurants grid.
 *
 * Filter / sort state lives in the URL-less local state (each new query
 * key spawns a new TanStack Query fetch). On a slow network we show
 * skeletons; on the next interaction the cached page swaps in instantly.
 *
 * The Wolt-style "show only open" toggle stays client-side because the
 * `is_open` flag changes minute-to-minute and we don't want to thrash
 * the cache key for it — we filter in-memory for a snappier feel.
 */
export function RestaurantsGrid() {
  const t = useTranslations('restaurants_page');
  const tCard = useTranslations('restaurant_card');
  const tCommon = useTranslations('common');
  const localeRaw = useLocale();
  const locale = isPublicLocale(localeRaw) ? localeRaw : 'uz';

  const [cuisine, setCuisine] = useState<CategoryId>('all');
  const [sort, setSort] = useState<SortKey>('popularity');
  const [openOnly, setOpenOnly] = useState(false);

  const { data, isLoading, isError, refetch } = usePublicRestaurants({
    cuisine: cuisine === 'all' ? undefined : (cuisine as PublicCuisine),
    sort: sortKeyToApi(sort),
    per_page: 24,
  });

  const visible = useMemo<Restaurant[]>(() => {
    const list = publicRestaurantsToUi(data?.data ?? [], locale);
    return openOnly ? list.filter((r) => r.isOpen) : list;
  }, [data?.data, locale, openOnly]);

  const cardLabels = {
    minutes: tCard('minutes'),
    free: tCard('free'),
    closed: tCard('closed'),
    soum: tCard('soum'),
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      <CuisineFilterChips active={cuisine} onChange={setCuisine} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-600">
          {t('results_count', { count: visible.length })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpenOnly((v) => !v)}
            aria-pressed={openOnly}
            className={
              openOnly
                ? 'inline-flex h-11 items-center gap-2 rounded-full bg-mint-500 px-4 text-sm font-bold text-white transition'
                : 'inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50'
            }
          >
            <span
              aria-hidden="true"
              className={
                openOnly ? 'h-2 w-2 rounded-full bg-white' : 'h-2 w-2 rounded-full bg-mint-500'
              }
            />
            {t('filter_open')}
          </button>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-20 text-center">
          <span className="text-7xl" aria-hidden="true">
            ⚠️
          </span>
          <h2 className="font-display text-xl font-bold text-neutral-900">
            {t('no_results_title')}
          </h2>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 inline-flex h-11 items-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            {tCommon('retry')}
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-20 text-center">
          <span className="text-7xl" aria-hidden="true">
            🍽️
          </span>
          <h2 className="font-display text-xl font-bold text-neutral-900">
            {t('no_results_title')}
          </h2>
          <p className="text-sm text-neutral-500">{t('no_results_hint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              variant="vertical"
              locale={locale}
              labels={cardLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function sortKeyToApi(sort: SortKey): 'popular' | 'delivery_time' | 'cheapest' {
  switch (sort) {
    case 'popularity':
      return 'popular';
    case 'delivery':
      return 'delivery_time';
    case 'price':
      return 'cheapest';
  }
}
