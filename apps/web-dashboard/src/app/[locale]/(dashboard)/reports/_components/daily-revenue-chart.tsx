'use client';

import type { DailyRevenuePoint } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function DailyRevenueChart({ points }: { points: DailyRevenuePoint[] }) {
  const t = useTranslations('reports');

  if (points.length === 0) {
    return (
      <ChartShell title={t('charts.daily_revenue_title')}>
        <EmptyState label={t('empty')} />
      </ChartShell>
    );
  }

  const formatDate = (d: string): string => d.slice(5); // MM-DD
  const formatRevenue = (v: number): string => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
    return String(v);
  };

  return (
    <ChartShell title={t('charts.daily_revenue_title')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#737373' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatRevenue}
            tick={{ fontSize: 11, fill: '#737373' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e5e5',
            }}
            labelFormatter={(label) => String(label)}
            formatter={(value: number, key: string) => {
              if (key === 'revenue') return [formatUZS(value), t('metrics.total_revenue')];
              return [value, t('metrics.total_orders')];
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-sm text-neutral-500">
      {label}
    </div>
  );
}
