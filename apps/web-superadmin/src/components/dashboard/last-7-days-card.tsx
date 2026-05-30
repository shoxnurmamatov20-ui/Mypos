'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from 'next-themes';
import { MOCK_LAST_7_DAYS } from '@/data/mock-feedback';

/**
 * So'nggi 7 kunlik — grouped bar chart of new sign-ups vs. order count
 * per day. Two thin coloured bars per day (teal sign-ups, blue orders).
 */
export function Last7DaysCard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,34,31,0.06)';
  const tick = isDark ? '#94a3b8' : '#62716d';

  const totalSignups = MOCK_LAST_7_DAYS.reduce((s, d) => s + d.signups, 0);
  const totalOrders = MOCK_LAST_7_DAYS.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="bg-white dark:bg-[#111827] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden transition-colors">
      <div className="px-4 sm:px-[18px] pt-4 pb-1 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white">
            So&apos;nggi 7 kunlik
          </h3>
          <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
            Yangi tenant va buyurtmalar
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-[#62716d] dark:text-[#94a3b8]">
            Tenant{' '}
            <span className="font-bold text-[#16221f] dark:text-white tabular-nums">
              {totalSignups}
            </span>
          </span>
          <span className="text-[#62716d] dark:text-[#94a3b8]">
            Buyurtma{' '}
            <span className="font-bold text-[#16221f] dark:text-white tabular-nums">
              {totalOrders}
            </span>
          </span>
        </div>
      </div>
      <div className="px-3 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[...MOCK_LAST_7_DAYS]}
            margin={{ top: 16, right: 12, left: -10, bottom: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(22,34,31,0.04)' }}
              contentStyle={{
                background: isDark ? '#0b1120' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(22,34,31,0.09)'}`,
                borderRadius: 10,
                fontSize: 12,
                color: isDark ? '#e2e8f0' : '#16221f',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8, color: tick }}
            />
            <Bar
              yAxisId="left"
              dataKey="signups"
              name="Yangi tenant"
              fill={isDark ? '#14b8a6' : '#0f766e'}
              radius={[5, 5, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              yAxisId="right"
              dataKey="orders"
              name="Buyurtma"
              fill={isDark ? '#3b82f6' : '#2563eb'}
              radius={[5, 5, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
