'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from 'next-themes';
import { MOCK_FEEDBACK_DYNAMICS } from '@/data/mock-feedback';

/**
 * Feedback dinamikasi — line chart with two y-axes (count on the left,
 * average rating on the right). Teal solid line for count, dashed amber
 * for rating. ShifoReyting `lineChart` ekvivalenti.
 */
export function FeedbackDynamicsCard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const teal = isDark ? '#14b8a6' : '#0f766e';
  const amber = isDark ? '#f59e0b' : '#d97706';
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,34,31,0.06)';
  const tick = isDark ? '#94a3b8' : '#62716d';

  return (
    <div className="bg-white dark:bg-[#111827] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden transition-colors">
      <div className="px-[18px] pt-4 pb-1 flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white">
            Feedback dinamikasi
          </h3>
          <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
            So&apos;nggi 14 kun
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-[#15803d] dark:text-emerald-400 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
      <div className="px-3 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={MOCK_FEEDBACK_DYNAMICS}
            margin={{ top: 16, right: 12, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              padding={{ left: 6, right: 6 }}
            />
            <YAxis
              yAxisId="count"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <YAxis
              yAxisId="rating"
              orientation="right"
              domain={[0, 5]}
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
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
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              name="Feedback soni"
              stroke={teal}
              strokeWidth={2.5}
              dot={{ r: 3, fill: teal, stroke: isDark ? '#0b1120' : '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? '#0b1120' : '#fff' }}
            />
            <Line
              yAxisId="rating"
              type="monotone"
              dataKey="rating"
              name="O'rtacha reyting"
              stroke={amber}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: amber, stroke: isDark ? '#0b1120' : '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? '#0b1120' : '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
