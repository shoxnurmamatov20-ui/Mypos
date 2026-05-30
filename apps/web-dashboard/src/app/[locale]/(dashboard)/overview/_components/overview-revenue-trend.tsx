'use client';

import type { DailyRevenuePoint } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/** Minor units (tiyin) → compact major-UZS label for chart axes. */
function compactUZS(minor: number): string {
  const major = minor / 100;
  if (major >= 1_000_000) return `${(major / 1_000_000).toFixed(1)}M`;
  if (major >= 1_000) return `${Math.round(major / 1_000)}K`;
  return String(Math.round(major));
}

type Props = {
  points: DailyRevenuePoint[];
  locale: string;
};

/**
 * Revenue dynamics area chart — himoya/ShifoReyting teal gradient on a
 * borderless card surface, mirroring the web-superadmin dashboard's
 * revenue panel.
 */
export function OverviewRevenueTrend({ points, locale }: Props) {
  const t = useTranslations('overview');

  const data = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        label: new Date(p.date).toLocaleDateString(
          locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'uz-UZ',
          { day: 'numeric', month: 'short' },
        ),
        revenue: p.revenue,
        orders: p.orders,
      })),
    [points, locale],
  );

  const hasData = data.some((d) => d.revenue > 0);
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white transition-colors dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <header className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
        <h3 className="text-base font-semibold tracking-tight text-[#16221f] dark:text-white">
          {t('sections.revenue_trend')}
        </h3>
        <span className="tabular-nums text-xs text-[#62716d] dark:text-[#94a3b8]">
          {t('labels.revenue')}:{' '}
          <span className="font-bold text-[#16221f] dark:text-white">
            {formatUZS(total)}
          </span>
        </span>
      </header>

      <div className="px-3 pb-4 pt-2">
        {!hasData ? (
          <div className="flex h-[260px] flex-col items-center justify-center text-[#62716d] dark:text-[#94a3b8]">
            <Inbox className="mb-2 h-8 w-8 opacity-60" strokeWidth={1.5} />
            <p className="text-[13px]">{t('empty')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="overviewRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(22,34,31,0.07)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#62716d' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#62716d' }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={compactUZS}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid rgba(22,34,31,0.09)',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 4px 20px rgba(18,34,31,0.08)',
                }}
                formatter={(value: number, key: string) =>
                  key === 'revenue'
                    ? [formatUZS(value), t('labels.revenue')]
                    : [value, t('labels.orders')]
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0f766e"
                strokeWidth={2.5}
                fill="url(#overviewRevenue)"
                dot={{ fill: '#0f766e', r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
