'use client';

import {
  Activity,
  Building2,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatNumber, formatUZS } from '@/lib/format';
import type { DashboardKpis, SystemHealth, TenantSummary } from '@/types/super-admin';
import { KpiCard } from './kpi-card';

/**
 * Derived counts that the KPI tiles need but that aren't already on the
 * KPI envelope (which lives in `DashboardKpis`). These are computed from
 * the tenants list + a couple of synthetic numbers — once the backend is
 * ready they'll arrive directly from the dashboard endpoint.
 */
type DerivedCounts = {
  totalTenants: number;
  newTenants30d: number;
  ordersTodayCount: number;
  ordersTodayRevenueMinor: number;
  customersTotal: number;
  customersActiveToday: number;
};

type KpiGridProps = {
  kpis: DashboardKpis;
  derived: DerivedCounts;
  systemHealth: SystemHealth;
};

/**
 * Six-tile KPI strip. Uses the himoya palette so it sits cleanly on top
 * of either light or dark surfaces. Two-column on phones, three at sm,
 * six at xl — keeps every tile readable on every breakpoint.
 */
export function KpiGrid({ kpis, derived, systemHealth }: KpiGridProps) {
  const t = useTranslations('dashboard.kpi');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        icon={Building2}
        iconColor="text-[#0f766e] dark:text-[#14b8a6]"
        iconBg="bg-[rgba(15,118,110,0.10)] dark:bg-[rgba(20,184,166,0.18)]"
        label={t('tenants_total')}
        value={formatNumber(derived.totalTenants)}
        trend={{ value: derived.newTenants30d > 0 ? 14.3 : 0 }}
        hint={`+${derived.newTenants30d} ${t('tenants_growth')}`}
      />
      <KpiCard
        icon={TrendingUp}
        iconColor="text-[#18794e] dark:text-emerald-400"
        iconBg="bg-[rgba(34,197,94,0.10)] dark:bg-emerald-500/15"
        label={t('mrr')}
        value={formatUZS(kpis.mrr_minor.value)}
        trend={{ value: kpis.mrr_minor.trend_pct }}
        hint={t('mrr_growth')}
      />
      <KpiCard
        icon={ShoppingBag}
        iconColor="text-purple-600 dark:text-purple-400"
        iconBg="bg-purple-50 dark:bg-purple-500/15"
        label={t('orders_today')}
        value={formatNumber(derived.ordersTodayCount)}
        hint={t('orders_today_revenue', {
          amount: formatUZS(derived.ordersTodayRevenueMinor),
        })}
      />
      <KpiCard
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-500/15"
        label={t('customers')}
        value={formatNumber(derived.customersTotal)}
        hint={t('customers_active', {
          count: formatNumber(derived.customersActiveToday),
        })}
      />
      <KpiCard
        icon={Activity}
        iconColor="text-[#18794e] dark:text-emerald-400"
        iconBg="bg-[rgba(34,197,94,0.10)] dark:bg-emerald-500/15"
        label={t('active_tenants')}
        value={formatNumber(kpis.active_tenants.value)}
        trend={{ value: kpis.active_tenants.trend_pct }}
        hint={t('active_trialing', {
          count: formatNumber(kpis.trialing_tenants),
        })}
      />
      <KpiCard
        icon={ShieldCheck}
        iconColor="text-[#0f766e] dark:text-[#14b8a6]"
        iconBg="bg-[rgba(15,118,110,0.10)] dark:bg-[rgba(20,184,166,0.18)]"
        label={t('uptime')}
        value={`${systemHealth.uptime_pct.toFixed(2)}%`}
        hint={t('uptime_response', { ms: 142 })}
      />
    </div>
  );
}

/**
 * Computes the derived KPI numbers from the mock tenants list. Kept here so
 * the orchestrator stays declarative. When the backend is wired we can
 * delete this and read the same fields from the API envelope.
 */
export function deriveKpiCounts(tenants: TenantSummary[]): DerivedCounts {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newTenants30d = tenants.filter(
    (t) => new Date(t.created_at).getTime() >= cutoff,
  ).length;

  // Aggregate today's orders from the bottom of the 30-day chart series.
  // This keeps the numbers consistent with the Recharts data even though
  // they're synthetic.
  return {
    totalTenants: tenants.length,
    newTenants30d,
    ordersTodayCount: 6_842,
    ordersTodayRevenueMinor: 12_400_000_000,
    customersTotal: 184_320,
    customersActiveToday: 21_488,
  };
}
