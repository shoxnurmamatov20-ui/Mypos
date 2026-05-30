'use client';

import type { OrderStatus } from '@mypos/api-client';
import { useTranslations } from 'next-intl';

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft: 'bg-[#eef4f3] text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  served: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
  completed: 'bg-[#eef4f3] text-[#16221f] dark:bg-[#1a2235] dark:text-[#e2e8f0]',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('orders');
  const classes = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {t(`filters.${status}` as 'filters.pending')}
    </span>
  );
}
