'use client';

import type { OrderStatus } from '@mypos/api-client';
import { useTranslations } from 'next-intl';

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  pending: 'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  served: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-neutral-200 text-neutral-800',
  cancelled: 'bg-rose-100 text-rose-800',
  refunded: 'bg-purple-100 text-purple-800',
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
