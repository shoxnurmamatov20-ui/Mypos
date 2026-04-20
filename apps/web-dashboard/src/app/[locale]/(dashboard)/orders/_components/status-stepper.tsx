'use client';

import type { OrderStatus } from '@mypos/api-client';
import { useTranslations } from 'next-intl';

const STEP_SEQUENCE: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'served',
  'completed',
];

export function StatusStepper({ status }: { status: OrderStatus }) {
  const t = useTranslations('orders');

  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
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
                    ? 'bg-brand-500 text-white'
                    : 'bg-neutral-200 text-neutral-500') +
                  (isCurrent ? ' ring-2 ring-brand-300 ring-offset-2' : '')
                }
              >
                {idx + 1}
              </div>
              <span
                className={
                  'mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider ' +
                  (reached ? 'text-brand-700' : 'text-neutral-400')
                }
              >
                {t(`filters.${step}` as 'filters.pending')}
              </span>
            </div>
            {idx < STEP_SEQUENCE.length - 1 && (
              <div
                className={
                  'h-0.5 flex-1 rounded-full ' +
                  (currentIndex > idx ? 'bg-brand-500' : 'bg-neutral-200')
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
