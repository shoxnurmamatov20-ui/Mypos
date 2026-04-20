'use client';

import type { OrderSummary } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';

export function StatsCards({ summary }: { summary: OrderSummary }) {
  const t = useTranslations('reports');

  const cards: Array<{
    key: string;
    label: string;
    value: string;
    accent: string;
  }> = [
    {
      key: 'total_orders',
      label: t('metrics.total_orders'),
      value: summary.total_orders.toLocaleString('ru-RU'),
      accent: 'text-brand-600',
    },
    {
      key: 'total_revenue',
      label: t('metrics.total_revenue'),
      value: formatUZS(summary.total_revenue),
      accent: 'text-mint-700',
    },
    {
      key: 'avg_order',
      label: t('metrics.avg_order'),
      value: formatUZS(summary.avg_order_value),
      accent: 'text-gold-700',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.key}
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            {c.label}
          </div>
          <div className={`mt-2 font-display text-2xl font-bold ${c.accent}`}>
            {c.value}
          </div>
        </div>
      ))}
    </section>
  );
}
