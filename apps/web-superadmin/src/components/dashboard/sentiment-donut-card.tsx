'use client';

import { useTheme } from 'next-themes';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_SENTIMENT } from '@/data/mock-feedback';

/**
 * Sentiment — donut split positive / neutral / negative. Center label
 * shows the total count. ShifoReyting `sentimentChart` ekvivalenti.
 */
export function SentimentDonutCard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const borderColor = isDark ? '#0b1120' : '#fff';

  const total = MOCK_SENTIMENT.reduce((s, x) => s + x.count, 0);
  const data = MOCK_SENTIMENT.map((s) => ({ name: s.label, value: s.count, color: s.color }));

  return (
    <div className="bg-white dark:bg-[#111827] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden transition-colors">
      <div className="px-[18px] pt-4 pb-1">
        <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white">Sentiment</h3>
        <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">Fikrlar tahlili</p>
      </div>
      <div className="px-4 pb-4 pt-1">
        <div className="relative">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
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
            <p className="text-[26px] font-extrabold text-[#16221f] dark:text-white leading-none tabular-nums">
              {total}
            </p>
            <p className="text-[10px] text-[#62716d] dark:text-[#94a3b8] mt-1">Jami</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MOCK_SENTIMENT.map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.key} className="flex flex-col items-center text-center">
                <span
                  className="w-2 h-2 rounded-full mb-1"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">{s.label}</span>
                <span className="text-[12px] font-bold text-[#16221f] dark:text-white tabular-nums">
                  {s.count}{' '}
                  <span className="text-[#62716d] dark:text-[#94a3b8] font-medium">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
