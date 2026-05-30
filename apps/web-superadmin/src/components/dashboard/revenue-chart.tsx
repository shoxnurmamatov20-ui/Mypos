'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactNumber, formatUZS } from '@/lib/format';
import type { MockRevenuePoint } from '@/types/super-admin';
import { DashboardTooltip } from './chart-tooltip';

type RevenueChartProps = {
  data: MockRevenuePoint[];
  /** Period chip label, e.g. "30 days". */
  periodLabel: string;
};

export function RevenueChart({ data, periodLabel }: RevenueChartProps) {
  const t = useTranslations('dashboard.charts');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.revenue_minor, 0),
    [data],
  );

  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,34,31,0.06)';
  const tick = isDark ? '#94a3b8' : '#62716d';
  const accent = isDark ? '#14b8a6' : '#0f766e';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle hint={`${t('revenue_total')}: ${formatUZS(total)}`}>
          {t('revenue_title')}
        </CardTitle>
        <span className="rounded-full bg-[#eef4f3] dark:bg-[#1a2235] px-3 py-1 text-xs font-semibold text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap">
          {periodLabel}
        </span>
      </CardHeader>

      {/* No negative margin — extending past card padding pushes the
          whole page into horizontal scroll on phones. */}
      <div className="h-[240px] sm:h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke={tick}
              tick={{ fill: tick, fontSize: 11 }}
              tickFormatter={(v: string) => format(new Date(v), 'd MMM')}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              stroke={tick}
              tick={{ fill: tick, fontSize: 11 }}
              tickFormatter={(v: number) => formatCompactNumber(Math.round(v / 100))}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ stroke: grid, strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<DashboardTooltip variant="revenue" />}
            />
            <Area
              type="monotone"
              dataKey="revenue_minor"
              stroke={accent}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              activeDot={{
                r: 5,
                stroke: isDark ? '#0b1120' : '#fff',
                strokeWidth: 2,
                fill: accent,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
