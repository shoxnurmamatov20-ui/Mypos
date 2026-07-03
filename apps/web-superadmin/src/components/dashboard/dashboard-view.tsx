'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  Inbox,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchDashboardKpis, fetchRevenueChart, fetchTenants } from '@/lib/api-helpers';
import { EventTypeDonutCard } from './event-type-donut-card';
import { FeedbackDynamicsCard } from './feedback-dynamics-card';
import { Last7DaysCard } from './last-7-days-card';
import { PlanDonutCard } from './plan-donut-card';
import { RecentTenantsTable } from './recent-tenants-table';
import { SentimentDonutCard } from './sentiment-donut-card';
import { StatCard } from './stat-card';
import { type STATUS_KEYS, StatusBreakdownCard } from './status-breakdown-card';
import { SystemHealthBar } from './system-health-bar';

type DashboardViewProps = { locale: string };

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('uz-UZ').format(n);
}

function formatUZS(minor: number): string {
  if (minor >= 1_000_000_000) return `${(minor / 1_000_000_000).toFixed(1)}B so'm`;
  if (minor >= 1_000_000) return `${(minor / 1_000_000).toFixed(1)}M so'm`;
  if (minor >= 1_000) return `${(minor / 1_000).toFixed(0)}K so'm`;
  return `${new Intl.NumberFormat('uz-UZ').format(minor)} so'm`;
}

/**
 * ShifoReyting-pattern dashboard. SystemHealthBar at the top, 4-column
 * stat-card grid matching the image (UPPERCASE label, big black
 * number, `↑ Yangi` chip, icon-in-coloured-box, accent-coloured bottom
 * bar), then a revenue area chart, plan donut, status breakdown, and
 * recent-tenants table.
 */
export function DashboardView({ locale }: DashboardViewProps) {
  const kpisQuery = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: fetchDashboardKpis });
  const revenueQuery = useQuery({ queryKey: ['dashboard', 'revenue'], queryFn: fetchRevenueChart });
  const tenantsQuery = useQuery({ queryKey: ['dashboard', 'tenants'], queryFn: fetchTenants });

  const isLoading = kpisQuery.isLoading || revenueQuery.isLoading || tenantsQuery.isLoading;

  const kpis = kpisQuery.data;
  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);

  const statusCounts = useMemo(() => {
    const init = { active: 0, trialing: 0, past_due: 0, suspended: 0 };
    return tenants.reduce(
      (acc, t) => {
        if (t.status in acc) acc[t.status as (typeof STATUS_KEYS)[number]]++;
        return acc;
      },
      init as Record<(typeof STATUS_KEYS)[number], number>,
    );
  }, [tenants]);
  const statusTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const planCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tenants) counts.set(t.plan, (counts.get(t.plan) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count);
  }, [tenants]);
  const planTotal = planCounts.reduce((s, x) => s + x.count, 0);

  const last7 = useMemo(() => {
    const data = revenueQuery.data ?? [];
    return data.slice(-7).map((d) => ({
      day: d.date,
      label: new Date(d.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
        day: 'numeric',
        month: 'short',
      }),
      revenue: Math.round(d.revenue_minor / 1000),
    }));
  }, [revenueQuery.data, locale]);
  const last7Has = last7.some((d) => d.revenue > 0);
  const last7Total = last7.reduce((s, d) => s + d.revenue, 0);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isError = kpisQuery.isError || revenueQuery.isError || tenantsQuery.isError;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-300/40 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 p-8 text-center">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-red-700 dark:text-red-200">
          Ma&apos;lumotlarni yuklab bo&apos;lmadi
        </p>
        <button
          type="button"
          onClick={() => {
            void kpisQuery.refetch();
            void revenueQuery.refetch();
            void tenantsQuery.refetch();
          }}
          className="inline-flex h-9 items-center rounded-md border border-red-500/40 bg-white dark:bg-[#111827] px-3 text-xs font-bold text-red-700 dark:text-red-300 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Derived KPIs to fill the 4×2 grid.
  const activeTenants = kpis?.active_tenants.value ?? 0;
  const trialing = kpis?.trialing_tenants ?? 0;
  const totalRevenue = kpis?.mrr_minor.value ?? 0;
  const totalOrders = kpis?.total_orders.value ?? 0;
  const atRisk = kpis?.at_risk_tenants ?? 0;
  const nrr = kpis?.nrr_pct.value ?? 0;
  const arrMinor = totalRevenue * 12;
  const conversionPct =
    activeTenants + trialing > 0
      ? Math.round((activeTenants / (activeTenants + trialing)) * 100)
      : 0;

  const tenantTrend = kpis?.active_tenants.trend_pct ?? 0;
  const mrrTrend = kpis?.mrr_minor.trend_pct ?? 0;
  const ordersTrend = kpis?.total_orders.trend_pct ?? 0;
  const nrrTrend = kpis?.nrr_pct.trend_pct ?? 0;

  const yangi = (text = 'Yangi') => ({ tone: 'good' as const, text });
  const xato = (text = 'Yangi') => ({ tone: 'bad' as const, text });

  return (
    <div className="space-y-3.5 md:space-y-4">
      {/* System health bar */}
      <SystemHealthBar />

      {/* KPI grid — 4 cards × 2 rows = image layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard
          label="Restoran"
          value={formatNumber(activeTenants)}
          sub={`${trialing} sinovda`}
          icon={Building2}
          accent="teal"
          fillPct={Math.min(100, activeTenants * 5)}
        />
        <StatCard
          label="Sinov"
          value={formatNumber(trialing)}
          sub="Faol trial"
          icon={Clock}
          accent="violet"
          fillPct={Math.min(100, trialing * 8)}
        />
        <StatCard
          label="MRR"
          value={formatUZS(totalRevenue)}
          sub="Oylik daromad"
          icon={TrendingUp}
          accent="green"
          delta={mrrTrend > 0.1 ? yangi() : null}
          fillPct={Math.min(100, totalRevenue / 1_000_000)}
        />
        <StatCard
          label="O'rtacha reyting"
          value={nrr ? (nrr / 20).toFixed(1) : '0.0'}
          sub="5.0 dan"
          icon={Star}
          accent="amber"
          delta={nrrTrend > 0.1 ? yangi() : null}
          fillPct={Math.min(100, (nrr / 100) * 80)}
        />
        <StatCard
          label="Ochiq risk"
          value={formatNumber(atRisk)}
          sub={`${atRisk} muddati o'tgan`}
          icon={AlertTriangle}
          accent="red"
          delta={atRisk > 0 ? xato() : null}
          fillPct={Math.min(100, atRisk * 10)}
        />
        <StatCard
          label="Buyurtma"
          value={formatNumber(totalOrders)}
          sub="Joriy oy"
          icon={ShoppingBag}
          accent="blue"
          delta={ordersTrend > 0.1 ? yangi() : null}
          fillPct={Math.min(100, totalOrders / 100)}
        />
        <StatCard
          label="Aktivatsiya"
          value={`${conversionPct}%`}
          sub="Trial → Aktiv"
          icon={Check}
          accent="indigo"
          delta={tenantTrend > 0.1 ? yangi() : null}
          fillPct={conversionPct}
        />
        <StatCard
          label="ARR"
          value={formatUZS(arrMinor)}
          sub="Yillik forecast"
          icon={ShieldCheck}
          accent="pink"
          delta={mrrTrend > 0.1 ? yangi() : null}
          fillPct={Math.min(100, arrMinor / 12_000_000)}
        />
      </div>

      {/* Revenue chart + Plan donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] rounded-[12px] overflow-hidden transition-colors">
          <div className="px-4 sm:px-[18px] pt-4 pb-1 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white">
                So&apos;nggi 7 kun
              </h3>
              <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
                Daromad dinamikasi
              </p>
            </div>
            <span className="text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
              jami{' '}
              <span className="font-bold text-[#16221f] dark:text-white">
                {formatNumber(last7Total)}K so&apos;m
              </span>
            </span>
          </div>
          <div className="px-2 sm:px-[18px] pb-[18px]">
            {!last7Has ? (
              <EmptyChart text="Ushbu hafta savdo yo'q" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={last7} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad7" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(22,34,31,0.06)"
                    vertical={false}
                  />
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
                    width={40}
                    tickFormatter={(v) => `${v}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid rgba(22,34,31,0.09)',
                      borderRadius: 10,
                      fontSize: 12,
                      boxShadow: '0 4px 20px rgba(18,34,31,0.08)',
                    }}
                    formatter={(v: number) => [`${formatNumber(v)}K so'm`, 'Savdo']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fill="url(#grad7)"
                    dot={{ fill: '#0f766e', r: 3, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <PlanDonutCard planCounts={planCounts} planTotal={planTotal} />
      </div>

      {/* Feedback dynamics + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="lg:col-span-2">
          <FeedbackDynamicsCard />
        </div>
        <SentimentDonutCard />
      </div>

      {/* Last 7 days + Event type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="lg:col-span-2">
          <Last7DaysCard />
        </div>
        <EventTypeDonutCard />
      </div>

      {/* Status breakdown */}
      <StatusBreakdownCard counts={statusCounts} total={statusTotal} />

      {/* Recent tenants */}
      <RecentTenantsTable tenants={tenants} locale={locale} />
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-[#62716d] dark:text-[#94a3b8]">
      <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-[13px]">{text}</p>
    </div>
  );
}

/**
 * Dashboard skeleton — matches the final layout so the page doesn't
 * "jump" when data arrives. Each block animates with the same pulse
 * timing for a calm, predictable feel.
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-3.5" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="h-10 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[122px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px]"
          >
            <div className="h-[34px] w-[34px] rounded-[10px] animate-pulse bg-gray-200 dark:bg-gray-800 ml-auto" />
            <div className="mt-3 h-3 w-16 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-7 w-20 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-[3px] rounded-[2px] animate-pulse bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="lg:col-span-2 h-[290px] rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] animate-pulse" />
        <div className="h-[290px] rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] animate-pulse" />
      </div>
      <div className="h-[420px] rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] animate-pulse" />
    </div>
  );
}
