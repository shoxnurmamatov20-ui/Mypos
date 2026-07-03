'use client';

import { cn } from '@mypos/ui';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type FinanceCategory,
  type FinanceOperation,
  useFinanceHydrated,
  useFinanceStore,
} from '@/stores/finance';
import {
  SegmentedControl,
  type SegmentOption,
  SettingsCard,
  SettingsSkeleton,
} from '../../settings/_components/settings-ui';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

interface ChartBucket {
  label: string;
  income: number;
  expense: number;
}

interface TopCategory {
  id: string;
  name: string;
  color: string;
  total: number;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  return `${n.toLocaleString('uz-UZ')} so'm`;
}

/** Local-timezone ISO date (yyyy-mm-dd). NOT toISOString — that emits UTC and
 *  would shift the date back a day for UZ/KZ users in the early-morning hours. */
function localIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfPeriod(period: Period): string {
  const d = new Date();
  if (period === 'today') return localIso(d);
  if (period === 'week') d.setDate(d.getDate() - 6);
  else if (period === 'month') d.setDate(d.getDate() - 29);
  else if (period === 'quarter') d.setDate(d.getDate() - 89);
  else d.setDate(d.getDate() - 364);
  return localIso(d);
}

function filterByPeriod(ops: FinanceOperation[], period: Period): FinanceOperation[] {
  const from = startOfPeriod(period);
  const to = localIso();
  return ops.filter((o) => o.date >= from && o.date <= to);
}

function buildChartBuckets(ops: FinanceOperation[], period: Period): ChartBucket[] {
  const byGroup = new Map<string, { income: number; expense: number }>();
  const useMonthBucket = period === 'year' || period === 'quarter';
  for (const op of ops) {
    const key = useMonthBucket ? op.date.slice(0, 7) : op.date;
    const existing = byGroup.get(key) ?? { income: 0, expense: 0 };
    if (op.kind === 'income') existing.income += op.amount;
    else existing.expense += op.amount;
    byGroup.set(key, existing);
  }
  return Array.from(byGroup.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({ label: key, ...val }));
}

function topExpenseCategories(ops: FinanceOperation[], cats: FinanceCategory[]): TopCategory[] {
  const totals = new Map<string, number>();
  for (const op of ops) {
    if (op.kind === 'expense')
      totals.set(op.categoryId, (totals.get(op.categoryId) ?? 0) + op.amount);
  }
  return Array.from(totals.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, total]) => {
      const cat = cats.find((c) => c.id === id);
      return { id, name: cat?.name ?? id, color: cat?.color ?? '#64748b', total };
    });
}

// ─── Recharts tooltip ──────────────────────────────────────────────────────────

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-[13px] shadow-[0_4px_16px_rgba(18,34,31,0.14)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <p className="mb-1 font-semibold text-[#16221f] dark:text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="[font-feature-settings:'tnum']">
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[rgba(22,34,31,0.09)] bg-white px-5 py-4 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
        {icon}
      </div>
      <p className="text-[13px] leading-tight text-[#62716d] dark:text-[#94a3b8]">{label}</p>
      <p className="break-all text-[20px] font-semibold tracking-tight text-[#16221f] [font-feature-settings:'tnum'] dark:text-white">
        {value}
      </p>
    </div>
  );
}

// ─── Inner (post-hydration) ──────────────────────────────────────────────────

function OverviewInner() {
  const t = useTranslations('finance');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const operations = useFinanceStore((s) => s.operations);
  const categories = useFinanceStore((s) => s.categories);
  const [period, setPeriod] = useState<Period>('month');

  const periodOptions: readonly SegmentOption<Period>[] = [
    { value: 'today', label: t('period.today') },
    { value: 'week', label: t('period.week') },
    { value: 'month', label: t('period.month') },
    { value: 'quarter', label: t('period.quarter') },
    { value: 'year', label: t('period.year') },
  ];

  const filtered = useMemo(() => filterByPeriod(operations, period), [operations, period]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const op of filtered) {
      if (op.kind === 'income') inc += op.amount;
      else exp += op.amount;
    }
    return { totalIncome: inc, totalExpense: exp };
  }, [filtered]);

  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  const chartBuckets = useMemo(() => buildChartBuckets(filtered, period), [filtered, period]);
  const topExpenses = useMemo(
    () => topExpenseCategories(filtered, categories),
    [filtered, categories],
  );
  const maxExpense = topExpenses[0]?.total ?? 1;

  // Period-aware recent operations.
  const recentOps = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [filtered],
  );

  return (
    <div className="space-y-5">
      <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label={t('overview.total_income')}
          value={formatMoney(totalIncome)}
          icon={<TrendingUp className="h-4 w-4 text-white" strokeWidth={2.3} />}
          accent="bg-emerald-500"
        />
        <KpiCard
          label={t('overview.total_expense')}
          value={formatMoney(totalExpense)}
          icon={<TrendingDown className="h-4 w-4 text-white" strokeWidth={2.3} />}
          accent="bg-rose-500"
        />
        <KpiCard
          label={t('overview.net_profit')}
          value={formatMoney(netProfit)}
          icon={<Wallet className="h-4 w-4 text-white" strokeWidth={2.3} />}
          accent={netProfit >= 0 ? 'bg-teal-600 dark:bg-teal-500' : 'bg-rose-500'}
        />
        <KpiCard
          label={t('overview.margin')}
          value={`${margin}%`}
          icon={<TrendingUp className="h-4 w-4 text-white" strokeWidth={2.3} />}
          accent={margin >= 0 ? 'bg-teal-600 dark:bg-teal-500' : 'bg-rose-500'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SettingsCard title={t('overview.income_vs_expense')}>
          {chartBuckets.length === 0 ? (
            <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">
              {t('overview.no_operations')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartBuckets} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'rgba(15,118,110,0.06)' }} />
                <Bar
                  dataKey="income"
                  name={t('kind.income')}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name={t('kind.expense')}
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SettingsCard>

        <SettingsCard title={t('overview.top_expenses')}>
          {topExpenses.length === 0 ? (
            <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">
              {t('overview.no_operations')}
            </p>
          ) : (
            <ul className="space-y-3">
              {topExpenses.map((cat) => (
                <li key={cat.id} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#16221f] dark:text-[#e2e8f0]">
                    {cat.name}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-[#16221f] [font-feature-settings:'tnum'] dark:text-white">
                    {formatMoney(cat.total)}
                  </span>
                  <div className="w-16 shrink-0">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.round((cat.total / maxExpense) * 100)}%`,
                        backgroundColor: cat.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SettingsCard>
      </div>

      <SettingsCard title={t('overview.recent_operations')}>
        {recentOps.length === 0 ? (
          <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">
            {t('overview.no_operations')}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {recentOps.map((op) => {
                const cat = categories.find((c) => c.id === op.categoryId);
                const isIncome = op.kind === 'income';
                return (
                  <li key={op.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        isIncome ? 'bg-emerald-500' : 'bg-rose-500',
                      )}
                      aria-label={t(`kind.${op.kind}`)}
                    />
                    <span className="w-20 shrink-0 text-[12px] text-[#62716d] [font-feature-settings:'tnum'] dark:text-[#94a3b8]">
                      {op.date}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#16221f] dark:text-[#e2e8f0]">
                      {cat?.name ?? op.categoryId}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[13px] font-semibold [font-feature-settings:'tnum']",
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400',
                      )}
                    >
                      {isIncome ? '+' : '−'}
                      {formatMoney(op.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 border-t border-[rgba(22,34,31,0.06)] pt-3 dark:border-[rgba(255,255,255,0.05)]">
              <Link
                href={`/${locale}/finance/operations` as Route}
                prefetch
                className="text-[13px] font-semibold text-[#0f766e] transition-colors hover:underline dark:text-teal-300"
              >
                {t('overview.view_all')} →
              </Link>
            </div>
          </>
        )}
      </SettingsCard>
    </div>
  );
}

export function OverviewClient() {
  const hydrated = useFinanceHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <OverviewInner />;
}
