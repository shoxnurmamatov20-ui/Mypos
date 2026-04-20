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
        <div className="flex h-[260px] items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-sm text-neutral-500">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#737373' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#404040' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e5e5',
            }}
            formatter={(value: number, key: string) => {
              if (key === 'revenue') return [formatUZS(value), t('metrics.total_revenue')];
              return [value, t('charts.count')];
            }}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}
