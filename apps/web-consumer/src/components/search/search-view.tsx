'use client';

import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type CategoryId } from '@/data/restaurants';
import { RestaurantCard } from '@/components/restaurant/restaurant-card';
import { RestaurantCardSkeleton } from '@/components/ui/skeleton';
import { SearchFilters, type SortKey } from '@/components/search/search-filters';
import { isPublicLocale, type PublicCuisine } from '@/lib/public-api';
import { publicRestaurantsToUi } from '@/lib/public-api-mappers';
import { usePublicRestaurants } from '@/lib/hooks/use-public-restaurants';

const VALID_CUISINES: ReadonlyArray<CategoryId> = [
  'all',
  'uzbek',
  'fast_food',
  'pizza',
  'sushi',
  'cafe',
  'bakery',
  'asian',
  'european',
];
const VALID_SORTS: ReadonlyArray<SortKey> = ['popularity', 'delivery', 'cheapest'];

function parseCuisine(raw: string | null): CategoryId {
  if (!raw) return 'all';
  return (VALID_CUISINES as readonly string[]).includes(raw) ? (raw as CategoryId) : 'all';
}

function parseSort(raw: string | null): SortKey {
  if (!raw) return 'popularity';
  return (VALID_SORTS as readonly string[]).includes(raw) ? (raw as SortKey) : 'popularity';
}

function sortKeyToApi(sort: SortKey): 'popular' | 'delivery_time' | 'cheapest' {
  switch (sort) {
    case 'popularity':
      return 'popular';
    case 'delivery':
      return 'delivery_time';
    case 'cheapest':
      return 'cheapest';
  }
}

/**
 * Search page — server-driven filtering via the public restaurants API.
 *
 * URL params drive the query so each search is bookmarkable. The query
 * key `[q, cuisine, sort, openOnly]` mirrors the URL — TanStack Query's
 * cache absorbs back/forward navigation for free.
 */
export function SearchView() {
  const t = useTranslations('search');
  const tHome = useTranslations('home');
  const localeRaw = useLocale();
  const locale = isPublicLocale(localeRaw) ? localeRaw : 'uz';
  const router = useRouter();
  const params = useSearchParams();

  // Initial state from URL — bookmarkable.
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cuisine, setCuisine] = useState<CategoryId>(parseCuisine(params.get('cuisine')));
  const [sort, setSort] = useState<SortKey>(parseSort(params.get('sort')));
  const [openOnly, setOpenOnly] = useState(params.get('open') === '1');

  // Push state → URL (replace, not push, so each keystroke isn't a history entry).
  const syncUrl = useCallback(
    (next: { q: string; cuisine: CategoryId; sort: SortKey; openOnly: boolean }) => {
      const sp = new URLSearchParams();
      if (next.q.trim()) sp.set('q', next.q.trim());
      if (next.cuisine !== 'all') sp.set('cuisine', next.cuisine);
      if (next.sort !== 'popularity') sp.set('sort', next.sort);
      if (next.openOnly) sp.set('open', '1');
      const qs = sp.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    },
    [router],
  );

  // Debounce the query → URL sync; immediate sync for filter pills.
  useEffect(() => {
    const id = setTimeout(() => {
      syncUrl({ q, cuisine, sort, openOnly });
    }, 250);
    return () => clearTimeout(id);
  }, [q, cuisine, sort, openOnly, syncUrl]);

  // Server-driven results. We pass a debounced `q` so we don't fire a
  // request on every keystroke — TanStack Query handles dedupe past that.
  const debouncedQ = useDebouncedValue(q, 300);

  const { data, isLoading, isError } = usePublicRestaurants({
    cuisine: cuisine === 'all' ? undefined : (cuisine as PublicCuisine),
    sort: sortKeyToApi(sort),
    q: debouncedQ.trim() || undefined,
    per_page: 24,
  });

  const results = useMemo(() => {
    const list = publicRestaurantsToUi(data?.data ?? [], locale);
    return openOnly ? list.filter((r) => r.isOpen) : list;
  }, [data?.data, locale, openOnly]);

  const labels = {
    minutes: tHome('delivery_minutes', { minutes: '{minutes}' }),
    free: tHome('delivery_free'),
    closed: tHome('closed'),
    soum: locale === 'ru' ? 'сум' : "so'm",
  };

  const clearAll = () => {
    setQ('');
    setCuisine('all');
    setSort('popularity');
    setOpenOnly(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
        {t('title')}
      </h1>

      {/* Search input. */}
      <div className="mt-6 flex h-14 items-stretch overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/15">
        <div className="flex shrink-0 items-center pl-4 pr-2 text-neutral-400">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          autoFocus
          className="flex-1 bg-transparent pr-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label={t('clear_filters')}
            className="flex w-12 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Filters bar. */}
      <div className="mt-4">
        <SearchFilters
          locale={locale}
          cuisine={cuisine}
          sort={sort}
          openOnly={openOnly}
          onCuisineChange={setCuisine}
          onSortChange={setSort}
          onOpenOnlyChange={setOpenOnly}
        />
      </div>

      {/* Results. */}
      <section className="mt-8">
        <p className="text-sm font-semibold text-neutral-500">
          {t('results_count', { count: results.length })}
        </p>

        {isLoading ? (
          <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
              <li key={i}>
                <RestaurantCardSkeleton />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <EmptyState
            onClear={clearAll}
            hint={tHome('featured_error')}
            title={t('no_results_title')}
            clearLabel={t('clear_filters')}
          />
        ) : results.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
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
        ) : (
          <EmptyState
            onClear={clearAll}
            hint={t('no_results_hint')}
            title={t('no_results_title')}
            clearLabel={t('clear_filters')}
          />
        )}
      </section>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  hint: string;
  clearLabel: string;
  onClear: () => void;
};

function EmptyState({ title, hint, clearLabel, onClear }: EmptyStateProps) {
  return (
    <div className="mx-auto mt-12 max-w-md text-center">
      <p className="text-7xl" aria-hidden="true">
        🔍
      </p>
      <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-500">{hint}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
      >
        {clearLabel}
      </button>
    </div>
  );
}

/** Tiny debounce hook — keeps the API surface above ergonomic. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
