'use client';

import { cn, Input, PageHeader } from '@mypos/ui';
import { ForkKnife, MagnifyingGlass, Star } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { formatSom, getWaiterData } from '@/lib/waiter-data';

/** Menyu — read-only menu reference the waiter scans while taking orders. */
export function MenuView() {
  const t = useTranslations('waiter');
  const { menu } = useMemo(() => getWaiterData(), []);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => menu.map((category) => category.name), [menu]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu
      .filter((category) => activeCat === 'all' || category.name === activeCat)
      .flatMap((category) => category.items.map((item) => ({ ...item, category: category.name })))
      .filter((item) => q === '' || item.name.toLowerCase().includes(q));
  }, [menu, activeCat, query]);

  return (
    <div className="space-y-5">
      <PageHeader title={t('menu.title')} description={t('menu.subtitle')} />

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa6a3]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('menu.search')}
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {['all', ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCat(category)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
              activeCat === category
                ? 'bg-[#0f766e] text-white'
                : 'border border-[rgba(22,34,31,0.10)] bg-white text-[#62716d] hover:text-[#16221f]',
            )}
          >
            {category === 'all' ? t('menu.filterAll') : category}
          </button>
        ))}
      </div>

      {/* Items */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.14)] bg-white/60 px-6 py-14 text-center text-[13px] text-[#62716d]">
          {t('menu.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white">
          {rows.map((item, index) => (
            <div
              key={`${item.category}-${item.name}`}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3',
                index > 0 && 'border-t border-[rgba(22,34,31,0.06)]',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-[#eef4f3] text-[#0f766e]">
                  <ForkKnife className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-[#16221f]">{item.name}</p>
                    {item.popular ? (
                      <Star className="h-3.5 w-3.5 flex-shrink-0 text-[#b7791f]" weight="fill" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[#9aa6a3]">{item.category}</p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold',
                    item.available
                      ? 'bg-[rgba(24,121,78,0.10)] text-[#18794e]'
                      : 'bg-[rgba(22,34,31,0.06)] text-[#9aa6a3]',
                  )}
                >
                  {item.available ? t('menu.available') : t('menu.unavailable')}
                </span>
                <span className="w-[104px] text-right text-[13px] font-bold tabular-nums text-[#16221f]">
                  {formatSom(item.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
