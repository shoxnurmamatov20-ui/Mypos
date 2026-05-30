'use client';

import type { TopItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function TopItemsChart({ items }: { items: TopItem[] }) {
  const t = useTranslations('reports');

  if (items.length === 0) {
    return (
      <ChartShell title={t('charts.top_items_title')}>
        <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-[rgba(22,34,31,0.12)] text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.10)] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      </ChartShell>
    );
  }

  // Recharts horizontal (layout="vertical"): bars are drawn along X.
  const data = items.map((i) => ({
    name: i.name,
    count: i.count,
    revenue: i.revenue,
  }));

  return (
    <ChartShell title={t('charts.top_items_title')}>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 56)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(22,34,31,0.07)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#62716d' }}
            axisLine={{ stroke: 'rgba(22,34,31,0.07)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#62716d' }}
            axisLine={{ stroke: 'rgba(22,34,31,0.07)' }}
            tickLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid rgba(22,34,31,0.09)',
              borderRadius: 10,
              fontSize: 12,
              boxShadow: '0 4px 20px rgba(18,34,31,0.08)',
            }}
            formatter={(value: number, key: string) => {
              if (key === 'revenue') return [formatUZS(value), t('metrics.total_revenue')];
              return [value, t('charts.count')];
            }}
          />
          <Bar dataKey="count" fill="#0f766e" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-5 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <h2 className="mb-4 text-sm font-semibold text-[#16221f] dark:text-white">{title}</h2>
      {children}
    </div>
  );
}
