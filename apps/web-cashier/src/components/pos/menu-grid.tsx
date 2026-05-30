'use client';

import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { MenuItem } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney, pickName } from '@/lib/format';
import { useCartStore } from '@/stores/cart';

/** Tap-to-add menu item grid. Out-of-stock items render disabled. */
export function MenuGrid({ items, loading }: { items: MenuItem[]; loading: boolean }) {
  const t = useTranslations('pos');
  const locale = useLocale();
  const add = useCartStore((s) => s.add);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            key={i}
            className="h-[104px] animate-pulse rounded-xl border border-[rgba(22,34,31,0.06)] bg-gray-100 dark:border-[rgba(255,255,255,0.05)] dark:bg-gray-800/60"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.14)] py-12 text-center text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.1)] dark:text-[#94a3b8]">
        {t('no_items')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const disabled = !item.is_available;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => add(item)}
            className={cn(
              'group relative flex h-[104px] flex-col justify-between rounded-xl border p-3 text-left transition-all',
              disabled
                ? 'cursor-not-allowed border-[rgba(22,34,31,0.06)] bg-gray-50 opacity-60 dark:border-[rgba(255,255,255,0.05)] dark:bg-gray-900/40'
                : 'border-[rgba(22,34,31,0.09)] bg-white hover:border-[#0f766e] hover:shadow-[0_2px_12px_rgba(15,118,110,0.12)] active:scale-[0.98] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:hover:border-[#14b8a6]',
            )}
          >
            <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#16221f] dark:text-white">
              {pickName(item.name, locale)}
            </span>
            <span className="flex items-center justify-between">
              <span className="tnum text-[13px] font-bold text-[#0f766e] dark:text-[#5ed6c9]">
                {formatMoney(item.price)}
              </span>
              {disabled ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                  {t('out_of_stock')}
                </span>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4f3] text-[#0f766e] transition-colors group-hover:bg-[#0f766e] group-hover:text-white dark:bg-[#1a2235] dark:text-[#5ed6c9]">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
