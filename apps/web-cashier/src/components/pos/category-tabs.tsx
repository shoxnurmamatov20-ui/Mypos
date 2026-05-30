'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { MenuCategory } from '@/lib/api';
import { cn } from '@/lib/cn';
import { pickName } from '@/lib/format';

/** Horizontal, scrollable category pills. `all` is always the first pill. */
export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: MenuCategory[];
  active: string;
  onChange: (id: string) => void;
}) {
  const t = useTranslations('pos');
  const locale = useLocale();

  const pill = (id: string, label: string) => {
    const isActive = active === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={cn(
          'flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
          isActive
            ? 'bg-[#0f766e] text-white'
            : 'bg-[#eef4f3] text-[#62716d] hover:text-[#16221f] dark:bg-[#1a2235] dark:text-[#94a3b8] dark:hover:text-white',
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {pill('all', t('all_categories'))}
      {categories.map((c) => pill(c.id, pickName(c.name, locale)))}
    </div>
  );
}
