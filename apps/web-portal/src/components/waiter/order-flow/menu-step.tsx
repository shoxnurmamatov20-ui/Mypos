'use client';

import { cn, Input } from '@mypos/ui';
import { ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { formatUzs, type MenuItem } from '@/lib/waiter-data';
import { Skeleton } from '../waiter-bits';

export type FlowMenuItem = MenuItem & { category: string };

/**
 * Menu grid for the active check (screenshot 5.png): a back+breadcrumb bar and
 * a search box on top, horizontally-scrolling category chips, then a
 * two-column card grid of dishes. Tapping a card opens the product detail.
 */
export function MenuStep({
  breadcrumb,
  onBack,
  categories,
  items,
  isLoading,
  onOpenProduct,
}: {
  breadcrumb: string;
  onBack: () => void;
  categories: string[];
  items: FlowMenuItem[];
  isLoading: boolean;
  onOpenProduct: (item: FlowMenuItem) => void;
}) {
  const t = useTranslations('waiter');
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => activeCat === 'all' || item.category === activeCat)
      .filter((item) => q === '' || item.name.toLowerCase().includes(q));
  }, [items, activeCat, query]);

  return (
    <div className="animate-fade-in space-y-4 pb-28">
      {/* Header: back + breadcrumb + search */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex min-w-0 flex-shrink items-center gap-1.5 rounded-lg border border-hairline-soft bg-canvas px-3 py-2.5 text-caption-strong text-tenant transition-transform duration-200 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{breadcrumb}</span>
        </button>
        <div className="relative flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted-48" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('newOrder.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {['all', ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCat(category)}
            className={cn(
              'flex-shrink-0 rounded-md border px-3.5 py-2 text-caption-strong transition-all duration-200 active:scale-95',
              activeCat === category
                ? 'border-tenant bg-tenant-tint text-tenant'
                : 'border-transparent text-ink-muted-48 hover:text-ink',
            )}
          >
            {category === 'all' ? t('menu.filterAll') : category}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {['a', 'b', 'c', 'd'].map((key) => (
            <Skeleton key={key} className="h-[188px] rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline bg-canvas/60 px-6 py-14 text-center text-body text-ink-muted-80">
          {t('menu.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {rows.map((item) => (
            <ProductCard
              key={item.id ?? `${item.category}-${item.name}`}
              item={item}
              onClick={() => onOpenProduct(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ item, onClick }: { item: FlowMenuItem; onClick: () => void }) {
  const t = useTranslations('waiter');
  const orderable = item.available;
  return (
    <button
      type="button"
      onClick={orderable ? onClick : undefined}
      disabled={!orderable}
      className={cn(
        'group flex flex-col text-left transition-transform duration-200',
        orderable ? 'active:scale-[0.97]' : 'cursor-not-allowed opacity-50',
      )}
    >
      <ProductThumb item={item} />
      <p className="mt-2 line-clamp-2 px-0.5 text-caption-strong leading-tight text-ink">
        {item.name}
      </p>
      <span className="mt-1.5 self-start rounded-pill bg-parchment px-3 py-1 text-fine-print font-semibold tabular-nums text-ink-muted-80">
        {orderable ? formatUzs(item.price) : t('menu.unavailable')}
      </span>
    </button>
  );
}

/** Square dish thumbnail — real photo when present, else an emoji tile. */
function ProductThumb({ item }: { item: FlowMenuItem }) {
  if (item.image) {
    return (
      // biome-ignore lint/performance/noImgElement: tenant-hosted dish photos are external URLs, not bundled assets
      <img
        src={item.image}
        alt={item.name}
        className="aspect-[4/3] w-full rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-gradient-to-br from-parchment to-tenant-tint text-[40px]">
      <span aria-hidden>{item.emoji ?? '🍽️'}</span>
    </div>
  );
}
