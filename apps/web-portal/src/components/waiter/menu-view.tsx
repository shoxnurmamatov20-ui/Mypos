'use client';

import { cn, Input, PageHeader } from '@mypos/ui';
import { ForkKnife, MagnifyingGlass, Star } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useWaiterMenu } from '@/lib/use-waiter-data';
import { formatSom } from '@/lib/waiter-data';
import { DemoBadge, Skeleton } from './waiter-bits';

/** Menyu — read-only menu reference the waiter scans while taking orders. */
export function MenuView() {
  const t = useTranslations('waiter');
  const { menu, live, isLoading } = useWaiterMenu();
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
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title={t('menu.title')}
        description={t('menu.subtitle')}
        actions={<DemoBadge show={!live} />}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted-48" />
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
              'rounded-pill px-3 py-1.5 text-nav-link font-semibold transition-colors active:scale-95',
              activeCat === category
                ? 'bg-tenant text-tenant-on-primary'
                : 'border border-hairline-soft bg-canvas text-ink-muted-80 hover:text-ink',
            )}
          >
            {category === 'all' ? t('menu.filterAll') : category}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="space-y-2">
          {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
            <Skeleton key={key} className="h-14" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline bg-canvas/60 px-6 py-14 text-center text-caption text-ink-muted-80">
          {t('menu.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-hairline-soft bg-canvas">
          {rows.map((item, index) => (
            <div
              key={`${item.category}-${item.name}`}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3',
                index > 0 && 'border-t border-hairline-soft',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-tenant-tint text-tenant">
                  <ForkKnife className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-caption-strong text-ink">{item.name}</p>
                    {item.popular ? (
                      <Star className="h-3.5 w-3.5 flex-shrink-0 text-warning-text" weight="fill" />
                    ) : null}
                  </div>
                  <p className="text-fine-print text-ink-muted-48">{item.category}</p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span
                  className={cn(
                    'rounded-pill px-2 py-0.5 text-fine-print font-semibold',
                    item.available
                      ? 'bg-success-soft text-success-text'
                      : 'bg-ink-muted-48/10 text-ink-muted-48',
                  )}
                >
                  {item.available ? t('menu.available') : t('menu.unavailable')}
                </span>
                <span className="w-[104px] text-right text-caption-strong tabular-nums text-ink">
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
