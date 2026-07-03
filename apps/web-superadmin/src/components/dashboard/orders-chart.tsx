'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactNumber, formatNumber } from '@/lib/format';
import type { MockRevenuePoint } from '@/types/super-admin';
import { DashboardTooltip } from './chart-tooltip';

type OrdersChartProps = {
  data: MockRevenuePoint[];
  /** Period chip label, e.g. "30 days". */
  periodLabel: string;
};

export function OrdersChart({ data, periodLabel }: OrdersChartProps) {
  const t = useTranslations('dashboard.charts');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const total = useMemo(() => data.reduce((sum, d) => sum + d.orders, 0), [data]);

  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,34,31,0.06)';
  const tick = isDark ? '#94a3b8' : '#62716d';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle hint={`${t('orders_total')}: ${formatNumber(total)}`}>
          {t('orders_title')}
        </CardTitle>
        <span className="rounded-full bg-[#eef4f3] dark:bg-[#1a2235] px-3 py-1 text-xs font-semibold text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap">
          {periodLabel}
        </span>
      </CardHeader>

      {/* No negative margin — extending past card padding pushes the
          whole page into horizontal scroll on phones. min-w-0 lets
          Recharts shrink correctly inside the parent flex column. */}
      <div className="h-[240px] sm:h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.95} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.55} />
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
              tickFormatter={(v: number) => formatCompactNumber(v)}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.08)' }}
              content={<DashboardTooltip variant="orders" />}
            />
            <Bar
              dataKey="orders"
              fill="url(#ordersGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
