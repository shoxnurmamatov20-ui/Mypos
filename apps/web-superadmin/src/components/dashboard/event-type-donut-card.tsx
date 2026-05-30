'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from 'next-themes';
import { MOCK_EVENT_TYPES } from '@/data/mock-feedback';

/**
 * Hodisa turi — donut of audit log severity counts (last 30 days).
 * Mirrors ShifoReyting `complaintsChart` (low/medium/high/urgent →
 * info/warning/error/critical here).
 */
export function EventTypeDonutCard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const borderColor = isDark ? '#0b1120' : '#fff';

  const total = MOCK_EVENT_TYPES.reduce((s, x) => s + x.count, 0);
  const data = MOCK_EVENT_TYPES.map((e) => ({ name: e.label, value: e.count, color: e.color }));

  return (
    <div className="bg-white dark:bg-[#111827] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden transition-colors">
      <div className="px-[18px] pt-4 pb-1">
        <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white">Hodisa turi</h3>
        <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
          Og&apos;irlik darajasi (30 kun)
        </p>
      </div>
      <div className="px-4 pb-4 pt-1">
        <div className="relative">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                dataKey="value"
                paddingAngle={3}
                stroke={borderColor}
                strokeWidth={3}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[22px] font-extrabold text-[#16221f] dark:text-white leading-none tabular-nums">
              {total}
            </p>
            <p className="text-[10px] text-[#62716d] dark:text-[#94a3b8] mt-1">Jami</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {MOCK_EVENT_TYPES.map((e) => {
            const pct = total ? Math.round((e.count / total) * 100) : 0;
            return (
              <div key={e.key} className="flex items-center gap-2 text-[12px]">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: e.color }}
                  aria-hidden="true"
                />
                <span className="text-[#62716d] dark:text-[#94a3b8] flex-1 truncate">{e.label}</span>
                <span className="text-[#62716d] dark:text-[#94a3b8] tabular-nums">{pct}%</span>
                <span className="text-[#16221f] dark:text-white font-bold tabular-nums w-9 text-right">
                  {e.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
