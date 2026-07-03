'use client';

import type { PublicMenuCategory } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { type Locale, pickTranslation, translate } from '@/lib/i18n';

type Props = {
  categories: PublicMenuCategory[];
  activeId: string | null;
  onChange: (id: string | null) => void;
  locale: Locale;
};

export function MenuCategoryTabs({ categories, activeId, onChange, locale }: Props) {
  return (
    <nav
      className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur"
      aria-label="Kategoriyalar"
    >
      <ul className="flex gap-2">
        <li>
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              'min-h-12 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
              activeId === null
                ? 'bg-brand-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
            )}
          >
            {translate(locale, 'menu.allCategories')}
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              onClick={() => onChange(cat.id)}
              className={cn(
                'min-h-12 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
                activeId === cat.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
              )}
            >
              {pickTranslation(cat.name, locale)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
