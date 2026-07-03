'use client';

import { Filter, Globe, Search, X } from 'lucide-react';
import { useState } from 'react';
import { type Locale, translate } from '@/lib/i18n';

const DIETARY_TAGS = [
  'vegan',
  'vegetarian',
  'gluten-free',
  'lactose-free',
  'spicy',
  'halal',
] as const;
type DietaryTag = (typeof DIETARY_TAGS)[number];

const TAG_LABEL_KEY: Record<DietaryTag, string> = {
  vegan: 'filter.vegan',
  vegetarian: 'filter.vegetarian',
  'gluten-free': 'filter.glutenFree',
  'lactose-free': 'filter.lactoseFree',
  spicy: 'filter.spicy',
  halal: 'filter.halal',
};

const TAG_EMOJI: Record<DietaryTag, string> = {
  vegan: '🌱',
  vegetarian: '🥗',
  'gluten-free': '🌾',
  'lactose-free': '🥛',
  spicy: '🌶️',
  halal: '☪️',
};

type Props = {
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
  search: string;
  onSearchChange: (next: string) => void;
  activeTags: ReadonlySet<DietaryTag>;
  onTagsChange: (next: Set<DietaryTag>) => void;
};

export function MenuFilters({
  locale,
  onLocaleChange,
  search,
  onSearchChange,
  activeTags,
  onTagsChange,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const toggle = (tag: DietaryTag) => {
    const next = new Set(activeTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onTagsChange(next);
  };

  const activeCount = activeTags.size;

  return (
    <>
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-neutral-200 bg-white/95 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder={translate(locale, 'search.placeholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition active:scale-95"
            aria-label={translate(locale, 'filter.title')}
          >
            <Filter className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="inline-flex h-10 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 text-xs font-bold uppercase text-neutral-700"
            aria-label={translate(locale, 'lang.label')}
          >
            <Globe className="h-3.5 w-3.5" />
            {locale.toUpperCase()}
          </button>
        </div>

        {/* Filter chips */}
        {filtersOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => {
              const active = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    active
                      ? 'bg-brand-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <span>{TAG_EMOJI[tag]}</span>
                  <span>{translate(locale, TAG_LABEL_KEY[tag])}</span>
                  {active && <X className="h-3 w-3" />}
                </button>
              );
            })}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => onTagsChange(new Set())}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200"
              >
                <X className="h-3 w-3" />
                {translate(locale, 'filter.clear')}
              </button>
            )}
          </div>
        )}

        {/* Language picker dropdown */}
        {langOpen && (
          <div className="absolute right-4 mt-2 grid w-32 grid-cols-1 gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
            {(['uz', 'ru', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  onLocaleChange(l);
                  setLangOpen(false);
                }}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                  l === locale
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{l === 'uz' ? "O'zbek" : l === 'ru' ? 'Русский' : 'English'}</span>
                <span className="text-[10px] font-bold uppercase">{l}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export type { DietaryTag };
