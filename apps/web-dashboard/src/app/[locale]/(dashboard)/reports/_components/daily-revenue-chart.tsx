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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,34,31,0.07)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#62716d' }}
            axisLine={{ stroke: 'rgba(22,34,31,0.07)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatRevenue}
            tick={{ fontSize: 11, fill: '#62716d' }}
            axisLine={{ stroke: 'rgba(22,34,31,0.07)' }}
            tickLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid rgba(22,34,31,0.09)',
              borderRadius: 10,
              fontSize: 12,
              boxShadow: '0 4px 20px rgba(18,34,31,0.08)',
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
            stroke="#0f766e"
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
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-5 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <h2 className="mb-4 text-sm font-semibold text-[#16221f] dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-[rgba(22,34,31,0.12)] text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.10)] dark:text-[#94a3b8]">
      {label}
    </div>
  );
}
