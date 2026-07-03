'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { MrrByPlan } from '@/data/mock-billing';
import { cn } from '@/lib/cn';
import { formatNumber, formatPercent, formatUZS } from '@/lib/format';
import type { TenantPlan } from '@/types/super-admin';

type Props = {
  rows: MrrByPlan[];
  /** When `true`, the donut + table stack vertically (1/3-width column). */
  compact?: boolean;
};

/**
 * Plan colour palette — matches the `PlanBadge` styles in
 * `dashboard/badges.tsx`. Tailwind values picked from the standard
 * palette so we never drift between chart and pill.
 *
 *   free       → gray-400
 *   starter    → blue-600
 *   pro        → teal-500
 *   plus       → indigo-500
 *   business   → purple-600
 *   enterprise → pink-600 (was amber — collides with status warning)
 */
const PLAN_COLORS: Record<TenantPlan, string> = {
  enterprise: '#db2777',
  business: '#7c3aed',
  plus: '#6366f1',
  pro: '#14b8a6',
  starter: '#2563eb',
  free: '#94a3b8',
};

/** Donut + table breakdown of MRR per plan. */
export function MrrByPlanCard({ rows, compact = false }: Props) {
  const t = useTranslations('billing');
  const tPlan = useTranslations('plans');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chartData = rows.map((row) => ({
    name: tPlan(row.plan),
    value: row.mrr_minor / 100,
    plan: row.plan,
  }));

  const totalMrrMinor = rows.reduce((s, r) => s + r.mrr_minor, 0);
  const totalTenants = rows.reduce((s, r) => s + r.count, 0);

  return (
    <Card className="p-3 sm:p-4 md:p-5 overflow-hidden">
      <CardHeader className="mb-3 md:mb-4">
        <CardTitle hint={t('mrr_by_plan_subtitle')}>{t('mrr_by_plan_title')}</CardTitle>
      </CardHeader>

      <div className={compact ? 'flex flex-col gap-4' : 'grid gap-6 lg:grid-cols-2'}>
        <div
          className={cn(
            'relative w-full min-w-0',
            compact ? 'h-44 sm:h-48' : 'h-52 sm:h-56 lg:h-64',
          )}
          role="img"
          aria-label={`${t('mrr_by_plan_title')} – ${formatUZS(totalMrrMinor)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                stroke={isDark ? '#0b1120' : '#fff'}
                strokeWidth={2}
                isAnimationActive
              >
                {chartData.map((entry) => (
                  <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: isDark ? '#111827' : '#fff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 12,
                  fontSize: 12,
                  color: isDark ? '#e5e7eb' : '#111827',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: '8px 12px',
                }}
                labelStyle={{
                  color: isDark ? '#f9fafb' : '#111827',
                  fontWeight: 600,
                }}
                formatter={(value: number) => formatUZS(value * 100)}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre label — total MRR with tabular nums */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Jami
            </span>
            <span className="text-base md:text-lg font-bold tabular-nums text-gray-900 dark:text-white mt-0.5 truncate max-w-[80%]">
              {formatUZS(totalMrrMinor)}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums mt-0.5">
              {formatNumber(totalTenants)} tenant
            </span>
          </div>
        </div>

        {compact ? (
          // Tight legend list — used when the card sits in a 1/3 column.
          <ul className="space-y-2" role="list">
            {rows.map((row) => (
              <li
                key={row.plan}
                className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAN_COLORS[row.plan] }}
                />
                <span className="font-semibold text-gray-900 dark:text-white truncate flex-1">
                  {tPlan(row.plan)}
                </span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  {formatPercent(row.share_pct, { digits: 0 })}
                </span>
                <span className="font-bold tabular-nums text-gray-900 dark:text-white w-10 text-right">
                  {formatNumber(row.count)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  <th className="py-2 px-1">{t('mrr_table_plan')}</th>
                  <th className="py-2 px-1 text-right">{t('mrr_table_count')}</th>
                  <th className="py-2 px-1 text-right">{t('mrr_table_mrr')}</th>
                  <th className="py-2 px-1 text-right">{t('mrr_table_share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {rows.map((row) => (
                  <tr key={row.plan} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2.5 px-1">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PLAN_COLORS[row.plan] }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {tPlan(row.plan)}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-1 text-right tabular-nums">
                      {formatNumber(row.count)}
                    </td>
                    <td className="py-2.5 px-1 text-right font-bold tabular-nums text-gray-900 dark:text-white">
                      {formatUZS(row.mrr_minor)}
                    </td>
                    <td className="py-2.5 px-1 text-right tabular-nums text-gray-500 dark:text-gray-400">
                      {formatPercent(row.share_pct, { digits: 1 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
