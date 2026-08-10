'use client';

import { cn } from '@mypos/ui';
import { ArrowClockwise, Plus } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { formatUzs } from '@/lib/waiter-data';

export interface CheckLine {
  key: string;
  name: string;
  qty: number;
  price: number;
}

const MAX_CHECKS = 4;

/**
 * Hisob tabs for a table (screenshot 6.png). One tab per split check; the
 * active check's lines list below (empty → a single centred "Qo'shish" that
 * opens the menu). A floating refresh button reloads the floor.
 */
export function HisobStep({
  checkCount,
  activeCheck,
  lines,
  onSelectCheck,
  onAddCheck,
  onAddItems,
  onRefresh,
  isRefreshing,
}: {
  checkCount: number;
  activeCheck: number;
  lines: CheckLine[];
  onSelectCheck: (index: number) => void;
  onAddCheck: () => void;
  onAddItems: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const t = useTranslations('waiter');

  return (
    <div className="relative min-h-[62vh]">
      {/* Tab strip */}
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {Array.from({ length: checkCount }, (_unused, index) => index + 1).map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectCheck(index)}
            className={cn(
              'flex-shrink-0 rounded-md border px-4 py-2 text-caption-strong transition-all duration-200 active:scale-95',
              index === activeCheck
                ? 'border-tenant bg-tenant text-tenant-on-primary'
                : 'border-tenant/40 bg-canvas text-tenant hover:bg-tenant-tint',
            )}
          >
            {t('hisob.tab', { n: index })}
          </button>
        ))}
        {checkCount < MAX_CHECKS ? (
          <button
            type="button"
            onClick={onAddCheck}
            aria-label={t('hisob.add')}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md border border-hairline-soft bg-canvas text-ink-muted-48 transition-all duration-200 hover:text-tenant active:scale-95"
          >
            <Plus className="h-4 w-4" weight="bold" />
          </button>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 pt-12">
          <button
            type="button"
            onClick={onAddItems}
            className="rounded-pill bg-tenant px-16 py-3 text-body-strong text-tenant-on-primary transition-transform duration-200 active:scale-95"
          >
            {t('hisob.add')}
          </button>
          <p className="text-caption text-ink-muted-48">{t('hisob.empty')}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="overflow-hidden rounded-lg border border-hairline-soft bg-canvas">
            {lines.map((line, index) => (
              <div
                key={line.key}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3.5',
                  index > 0 && 'border-t border-hairline-soft',
                )}
              >
                <p className="min-w-0 truncate text-body text-ink">
                  <span className="tabular-nums text-tenant">{line.qty}×</span> {line.name}
                </p>
                <span className="flex-shrink-0 text-body-strong tabular-nums text-ink">
                  {formatUzs(line.price * line.qty)}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddItems}
            className="flex w-full items-center justify-center gap-1.5 rounded-pill border border-tenant bg-canvas py-2.5 text-caption-strong text-tenant transition-transform duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4" weight="bold" />
            {t('hisob.add')}
          </button>
        </div>
      )}

      {/* Refresh FAB — a floating control keeps the reference's single shadow */}
      <button
        type="button"
        onClick={onRefresh}
        aria-label={t('common.refresh')}
        className="absolute bottom-2 right-2 grid h-12 w-12 place-items-center rounded-full bg-tenant text-tenant-on-primary shadow-product transition-transform duration-200 active:scale-90"
      >
        <ArrowClockwise className={cn('h-5 w-5', isRefreshing && 'animate-spin')} weight="bold" />
      </button>
    </div>
  );
}
