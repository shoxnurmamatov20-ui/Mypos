'use client';

import { useTranslations } from 'next-intl';
import { useShift } from '@/hooks/use-cashier-data';
import { cn } from '@/lib/cn';

/**
 * Topbar chip mirroring the cashier's live shift state. A coloured dot plus
 * label — green when the shift is open, amber on break, grey otherwise.
 */
export function ShiftBadge() {
  const t = useTranslations('shift_badge');
  const { data } = useShift();
  const shift = data?.shift ?? null;

  const state: 'open' | 'on_break' | 'closed' | 'no_shift' = !shift
    ? 'no_shift'
    : shift.on_break
      ? 'on_break'
      : shift.status === 'open' || shift.status === 'in_progress'
        ? 'open'
        : 'closed';

  const dot = {
    open: 'bg-emerald-500',
    on_break: 'bg-amber-500',
    closed: 'bg-gray-400',
    no_shift: 'bg-gray-300 dark:bg-gray-600',
  }[state];

  return (
    <span className="flex h-8 items-center gap-1.5 rounded-md border border-[rgba(22,34,31,0.09)] bg-[#eef4f3] px-2.5 text-[12px] font-semibold text-[#16221f] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white">
      <span className={cn('h-2 w-2 rounded-full', dot)} aria-hidden="true" />
      <span className="hidden sm:inline">{t(state)}</span>
    </span>
  );
}
