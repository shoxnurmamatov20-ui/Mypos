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
    <dl className="flex flex-col gap-1.5 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white p-3 text-sm dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between">
          <dt
            className={
              row.emphasize
                ? 'font-semibold text-[#16221f] dark:text-white'
                : 'text-[#62716d] dark:text-[#94a3b8]'
            }
          >
            {row.label}
          </dt>
          <dd
            className={
              'tabular-nums ' +
              (row.emphasize
                ? 'text-base font-bold text-[#16221f] dark:text-white'
                : 'text-[#16221f] dark:text-[#e2e8f0]')
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
    <dl className="flex flex-col gap-1.5 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white p-3 text-sm dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-2">
          <dt className="text-[#62716d] dark:text-[#94a3b8]">{row.label}</dt>
          <dd className="text-[#16221f] tabular-nums dark:text-[#e2e8f0]">
            {row.value ? formatDateTime(new Date(row.value)) : t('timestamps.pending')}
          </dd>
        </div>
      ))}
    </dl>
  );
}
