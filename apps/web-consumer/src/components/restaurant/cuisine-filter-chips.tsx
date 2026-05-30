'use client';

import { useLocale } from 'next-intl';
import { type CategoryId, CUISINE_CATEGORIES } from '@/data/restaurants';

type CuisineFilterChipsProps = {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
};

/**
 * Horizontal scrollable row of cuisine filter chips.
 *
 * Each chip is a literal `bg-*` class string so the Tailwind JIT scanner
 * keeps them. We avoid string concatenation for that reason — see the
 * note in `data/restaurants.ts`.
 */
export function CuisineFilterChips({ active, onChange }: CuisineFilterChipsProps) {
  const locale = useLocale() as 'uz' | 'ru' | 'en';

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max items-center gap-2 pb-1">
        {CUISINE_CATEGORIES.map((cat) => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              aria-pressed={isActive}
              className={
                isActive
                  ? 'inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-bold text-white shadow-sm transition'
                  : 'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50'
              }
            >
              <span aria-hidden="true">{cat.emoji}</span>
              <span>{cat.label[locale]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
