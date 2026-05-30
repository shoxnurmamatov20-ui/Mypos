'use client';

import type { OrderSummary } from '@mypos/api-client';
import { StatCard } from '@mypos/ui';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';

export function StatsCards({ summary }: { summary: OrderSummary }) {
  const t = useTranslations('reports');

  const cards: Array<{ key: string; label: string; value: string }> = [
    {
      key: 'total_orders',
      label: t('metrics.total_orders'),
      value: summary.total_orders.toLocaleString('ru-RU'),
    },
    {
      key: 'total_revenue',
      label: t('metrics.total_revenue'),
      value: formatUZS(summary.total_revenue),
    },
    {
      key: 'avg_order',
      label: t('metrics.avg_order'),
      value: formatUZS(summary.avg_order_value),
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <StatCard key={c.key} label={c.label} value={c.value} />
      ))}
    </section>
  );
}
