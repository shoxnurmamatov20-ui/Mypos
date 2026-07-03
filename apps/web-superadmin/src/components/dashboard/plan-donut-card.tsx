'use client';

import { CreditCard, Inbox } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PLAN_STYLE: Record<string, { color: string; label: string }> = {
  free: { color: '#94a3b8', label: 'Free' },
  starter: { color: '#60a5fa', label: 'Starter' },
  pro: { color: '#3b82f6', label: 'Pro' },
  business: { color: '#8b5cf6', label: 'Business' },
  enterprise: { color: '#ec4899', label: 'Enterprise' },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('uz-UZ').format(n);
}

type Props = {
  planCounts: ReadonlyArray<{ plan: string; count: number }>;
  planTotal: number;
};

/** Donut chart of plan distribution + colour-coded legend rows. */
export function PlanDonutCard({ planCounts, planTotal }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[rgba(255,255,255,0.07)] rounded-xl transition-colors">
      <div className="p-4 pb-2 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          Tarif taqsimoti
        </h3>
      </div>
      <div className="p-4 pt-2">
        {planTotal === 0 ? (
          <div className="flex flex-col items-center justify-center h-[170px] text-gray-400 dark:text-gray-500">
            <Inbox className="w-7 h-7 mb-2" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm">Tenant yo&apos;q</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
              Yangi tenant qo&apos;shing
            </p>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={planCounts as Array<{ plan: string; count: number }>}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  dataKey="count"
                  paddingAngle={3}
                  stroke="none"
                >
                  {planCounts.map((d) => (
                    <Cell key={d.plan} fill={PLAN_STYLE[d.plan]?.color ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0b1120' : '#fff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(22,34,31,0.09)'}`,
                    borderRadius: 10,
                    fontSize: 12,
                    color: isDark ? '#fff' : '#16221f',
                    boxShadow: isDark
                      ? '0 4px 20px rgba(0,0,0,0.4)'
                      : '0 4px 12px rgba(18,34,31,0.08)',
                  }}
                  formatter={(v: number, _n, p: { payload?: { plan?: string } }) => [
                    v,
                    PLAN_STYLE[p?.payload?.plan ?? '']?.label ?? '',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tabular-nums">
                {formatNumber(planTotal)}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Jami</p>
            </div>
          </div>
        )}
        <div className="mt-3 space-y-1.5">
          {planCounts.map((d) => {
            const pct = planTotal ? Math.round((d.count / planTotal) * 100) : 0;
            const style = PLAN_STYLE[d.plan];
            return (
              <div key={d.plan} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: style?.color ?? '#94a3b8' }}
                  aria-hidden="true"
                />
                <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {style?.label ?? d.plan}
                </span>
                <span className="text-gray-400 dark:text-gray-500 tabular-nums">{pct}%</span>
                <span className="text-gray-900 dark:text-white font-medium tabular-nums w-8 text-right">
                  {d.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
