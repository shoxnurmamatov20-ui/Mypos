'use client';

import type { OrderStatus } from '@mypos/api-client';
import { useTranslations } from 'next-intl';

const STEP_SEQUENCE: OrderStatus[] = ['pending', 'preparing', 'ready', 'served', 'completed'];

export function StatusStepper({ status }: { status: OrderStatus }) {
  const t = useTranslations('orders');

  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
        {t(`filters.${status}` as 'filters.cancelled')}
      </div>
    );
  }

  const currentIndex = STEP_SEQUENCE.indexOf(status);

  return (
    <ol className="flex items-center gap-2 overflow-x-auto">
      {STEP_SEQUENCE.map((step, idx) => {
        const reached = currentIndex >= idx;
        const isCurrent = currentIndex === idx;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ' +
                  (reached
                    ? 'bg-[#0f766e] text-white dark:bg-[#14b8a6]'
                    : 'bg-[#eef4f3] text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]') +
                  (isCurrent
                    ? ' ring-2 ring-[#0f766e]/40 ring-offset-2 dark:ring-teal-500/40 dark:ring-offset-[#111827]'
                    : '')
                }
              >
                {idx + 1}
              </div>
              <span
                className={
                  'mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider ' +
                  (reached
                    ? 'text-[#0f766e] dark:text-teal-400'
                    : 'text-[#62716d] dark:text-[#94a3b8]')
                }
              >
                {t(`filters.${step}` as 'filters.pending')}
              </span>
            </div>
            {idx < STEP_SEQUENCE.length - 1 && (
              <div
                className={
                  'h-0.5 flex-1 rounded-full ' +
                  (currentIndex > idx
                    ? 'bg-[#0f766e] dark:bg-[#14b8a6]'
                    : 'bg-[#eef4f3] dark:bg-[#1a2235]')
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
