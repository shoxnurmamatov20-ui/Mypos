'use client';

import { type OrderSummary, statsApi } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  Flame,
  Receipt,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  UtensilsCrossed,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { type DashPeriod, PeriodChip } from '../../_components/period-chip';
import { DashStatCard } from '../../_components/stat-card';
import { SystemHealthBar } from '../../_components/system-health-bar';
import { OverviewRankings } from './overview-rankings';
import { OverviewRevenueTrend } from './overview-revenue-trend';
import { OverviewStatusBreakdown } from './overview-status-breakdown';

const EMPTY_SUMMARY: OrderSummary = {
  total_orders: 0,
  total_revenue: 0,
  avg_order_value: 0,
  orders_by_status: {
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    completed: 0,
    cancelled: 0,
  },
  daily_revenue: [],
  top_items: [],
  top_tables: [],
  payment_methods: [],
};

const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const rangeFor = (period: DashPeriod): { from: string; to: string } => {
  const now = new Date();
  const to = isoDate(now);
  const start = new Date(now);
  if (period === 'week') start.setDate(start.getDate() - 6);
  else if (period === 'month') start.setDate(start.getDate() - 29);
  else if (period === '90d') start.setDate(start.getDate() - 89);
  return { from: isoDate(start), to };
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

/**
 * Manager-panel overview dashboard. Mirrors the web-superadmin layout:
 * SystemHealthBar → 8-tile colored StatCard grid → revenue area chart +
 * status donut row → top-items / top-tables / payment-methods rankings.
 * Real-time refetch every 60s.
 */
export function OverviewDashboard({ locale }: { locale: string }) {
  const t = useTranslations('overview');
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<DashPeriod>('today');

  const range = useMemo(() => rangeFor(period), [period]);

  const summaryQuery = useQuery({
    queryKey: ['overview', 'summary', range.from, range.to],
    queryFn: () => statsApi.summary(apiClient, range),
    refetchInterval: 60_000,
  });

  const summary: OrderSummary = summaryQuery.data?.data ?? EMPTY_SUMMARY;
  const firstLoad = summaryQuery.isLoading && !summaryQuery.data;
  const failed = summaryQuery.isError && !summaryQuery.data;

  const total = summary.total_orders || 1;
  const s = summary.orders_by_status;

  return (
    <div className="space-y-3.5 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#16221f] dark:text-white">
            {user ? t('welcome', { name: user.name }) : t('welcome_generic')}
          </h1>
          <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">{t('subtitle')}</p>
        </div>
        <PeriodChip value={period} onChange={setPeriod} />
      </div>

      {firstLoad ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f766e] border-t-transparent dark:border-teal-400" />
        </div>
      ) : (
        <>
          {failed ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t('load_failed')}</span>
            </div>
          ) : null}

          <SystemHealthBar />

          {/* 8-tile colored KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <DashStatCard
              label={t('stats.orders')}
              value={summary.total_orders.toLocaleString('ru-RU')}
              icon={ShoppingBag}
              accent="teal"
              fillPct={Math.min(100, summary.total_orders)}
              delta={summary.total_orders > 0 ? { tone: 'good', text: 'Faol' } : null}
            />
            <DashStatCard
              label={t('stats.revenue')}
              value={formatUZS(summary.total_revenue)}
              icon={Wallet}
              accent="green"
              fillPct={Math.min(100, summary.total_revenue / 100000)}
            />
            <DashStatCard
              label={t('stats.avg_order')}
              value={formatUZS(summary.avg_order_value)}
              icon={Receipt}
              accent="blue"
              fillPct={Math.min(100, summary.avg_order_value / 10000)}
            />
            <DashStatCard
              label={t('stats.completed')}
              value={s.completed.toLocaleString('ru-RU')}
              icon={CheckCircle2}
              accent="green"
              fillPct={pct(s.completed, total)}
              sub={`${pct(s.completed, total)}%`}
            />
            <DashStatCard
              label={t('stats.pending')}
              value={s.pending.toLocaleString('ru-RU')}
              icon={Clock}
              accent="amber"
              fillPct={pct(s.pending, total)}
              sub={`${pct(s.pending, total)}%`}
            />
            <DashStatCard
              label={t('stats.preparing')}
              value={s.preparing.toLocaleString('ru-RU')}
              icon={Flame}
              accent="violet"
              fillPct={pct(s.preparing, total)}
              sub={`${pct(s.preparing, total)}%`}
            />
            <DashStatCard
              label={t('stats.ready')}
              value={s.ready.toLocaleString('ru-RU')}
              icon={UtensilsCrossed}
              accent="indigo"
              fillPct={pct(s.ready, total)}
              sub={`${pct(s.ready, total)}%`}
            />
            <DashStatCard
              label={t('stats.cancelled')}
              value={s.cancelled.toLocaleString('ru-RU')}
              icon={XCircle}
              accent="red"
              fillPct={pct(s.cancelled, total)}
              sub={`${pct(s.cancelled, total)}%`}
            />
          </div>

          {/* Revenue trend + status donut */}
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <OverviewRevenueTrend points={summary.daily_revenue} locale={locale} />
            </div>
            <OverviewStatusBreakdown data={summary.orders_by_status} />
          </div>

          {/* Rankings: top items / top tables / payment methods */}
          <OverviewRankings
            topItems={summary.top_items}
            topTables={summary.top_tables}
            paymentMethods={summary.payment_methods}
          />

          {/* Footer note */}
          <div className="flex items-center gap-2 text-[11px] text-[#62716d] dark:text-[#94a3b8] pt-1">
            <TrendingUp className="h-3 w-3 text-[#0f766e] dark:text-teal-400" strokeWidth={2.4} />
            <span>{t('auto_refresh', { seconds: 60 })}</span>
          </div>
        </>
      )}
    </div>
  );
}

// Re-export for unused import warning suppression in some builds.
export const _cn = cn;
