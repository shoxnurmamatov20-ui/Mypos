'use client';

import { useTranslations } from 'next-intl';
import { CUISINE_CATEGORIES, type CategoryId } from '@/data/restaurants';

export type SortKey = 'popularity' | 'delivery' | 'cheapest';

type SearchFiltersProps = {
  locale: 'uz' | 'ru' | 'en';
  cuisine: CategoryId;
  sort: SortKey;
  openOnly: boolean;
  onCuisineChange: (id: CategoryId) => void;
  onSortChange: (s: SortKey) => void;
  onOpenOnlyChange: (v: boolean) => void;
};

export function SearchFilters({
  locale,
  cuisine,
  sort,
  openOnly,
  onCuisineChange,
  onSortChange,
  onOpenOnlyChange,
}: SearchFiltersProps) {
  const t = useTranslations('search');

  return (
    <div className="sticky top-16 z-20 -mx-4 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-4 sm:py-3">
      {/* Cuisine pills — horizontal scroll on mobile. */}
      <div className="-mx-4 overflow-x-auto py-3 sm:mx-0 sm:py-0">
        <ul className="flex w-max gap-2 px-4 sm:px-0">
          {CUISINE_CATEGORIES.map((cat) => {
            const active = cuisine === cat.id;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onCuisineChange(cat.id)}
                  aria-pressed={active}
                  className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition ${
                    active
                      ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <span aria-hidden="true">{cat.emoji}</span>
                  <span>{cat.label[locale]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Secondary controls — sort + open-only toggle. */}
      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 py-3 sm:border-t-0 sm:pt-2">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <span className="text-neutral-500">{t('sort_label')}:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="popularity">{t('sort_popularity')}</option>
            <option value="delivery">{t('sort_delivery')}</option>
            <option value="cheapest">{t('sort_cheapest')}</option>
          </select>
        </label>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => onOpenOnlyChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
          />
          {t('filter_open_only')}
        </label>
      </div>
    </div>
  );
}
