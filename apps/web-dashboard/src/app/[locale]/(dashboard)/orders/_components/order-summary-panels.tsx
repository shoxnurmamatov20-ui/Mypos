'use client';

import type { Order } from '@mypos/api-client';
import { formatDateTime, formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';

export function AmountsBreakdown({ order }: { order: Order }) {
  const t = useTranslations('orders');
  const a = order.amounts;
  const rows: Array<{ key: string; label: string; value: number; emphasize?: boolean }> = [
    { key: 'subtotal', label: t('amounts.subtotal'), value: a.subtotal },
    { key: 'tax', label: t('amounts.tax'), value: a.tax },
    { key: 'discount', label: t('amounts.discount'), value: a.discount },
    { key: 'tip', label: t('amounts.tip'), value: a.tip },
    { key: 'service_charge', label: t('amounts.service_charge'), value: a.service_charge },
    { key: 'total', label: t('amounts.total'), value: a.total, emphasize: true },
    { key: 'paid', label: t('amounts.paid'), value: a.paid },
  ];

  return (
    <dl className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white p-3 text-sm">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between">
          <dt className={row.emphasize ? 'font-semibold text-neutral-900' : 'text-neutral-600'}>
            {row.label}
          </dt>
          <dd
            className={
              'tabular-nums ' +
              (row.emphasize ? 'text-base font-bold text-neutral-900' : 'text-neutral-800')
            }
          >
            {formatUZS(row.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Timestamps({ order }: { order: Order }) {
  const t = useTranslations('orders');
  const rows: Array<{ key: string; label: string; value: string | null }> = [
    { key: 'placed_at', label: t('timestamps.placed'), value: order.placed_at },
    { key: 'prepared_at', label: t('timestamps.prepared'), value: order.prepared_at },
    { key: 'served_at', label: t('timestamps.served'), value: order.served_at },
    { key: 'completed_at', label: t('timestamps.completed'), value: order.completed_at },
  ];

  return (
    <dl className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white p-3 text-sm">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-2">
          <dt className="text-neutral-600">{row.label}</dt>
          <dd className="text-neutral-800 tabular-nums">
            {row.value ? formatDateTime(new Date(row.value)) : t('timestamps.pending')}
          </dd>
        </div>
      ))}
    </dl>
  );
}
