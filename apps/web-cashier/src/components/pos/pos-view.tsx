'use client';

import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useMenu } from '@/hooks/use-cashier-data';
import { pickName } from '@/lib/format';
import { CartPanel } from './cart-panel';
import { CategoryTabs } from './category-tabs';
import { MenuGrid } from './menu-grid';

/**
 * The POS screen — the cashier's home. Left column is the searchable,
 * category-filtered catalog; the right column is the live order cart.
 */
export function PosView() {
  const t = useTranslations('pos');
  const locale = useLocale();
  const { data, isLoading } = useMenu();
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const inCategory = activeCat === 'all' || item.category_id === activeCat;
      const inQuery = q === '' || pickName(item.name, locale).toLowerCase().includes(q);
      return inCategory && inQuery;
    });
  }, [items, activeCat, query, locale]);

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {/* Catalog */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#16221f] dark:text-white">{t('title')}</h1>
            <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
              {t('subtitle')}
            </p>
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62716d] dark:text-[#94a3b8]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="h-10 w-full rounded-lg border border-[rgba(22,34,31,0.12)] bg-white pl-9 pr-3 text-sm text-[#16221f] outline-none transition-colors focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111827] dark:text-white"
            />
          </div>
        </div>

        <div className="mb-4">
          <CategoryTabs categories={categories} active={activeCat} onChange={setActiveCat} />
        </div>

        <MenuGrid items={filtered} loading={isLoading} />
      </div>

      {/* Cart */}
      <div className="lg:w-[360px] lg:flex-shrink-0">
        <CartPanel />
      </div>
    </div>
  );
}
