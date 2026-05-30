'use client';

import { CreditCard, Repeat, TrendingUp, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { formatNumber, formatPercent, formatUZS } from '@/lib/format';
import type { MrrSummary } from '@/data/mock-billing';

type Props = {
  summary: MrrSummary;
};

/**
 * Billing KPI strip — 4 cards in a responsive grid:
 *   - 2 cols on phones (matches dashboard's KPI grid; single-column
 *     stack felt too tall — the dashboard pattern keeps all four KPIs
 *     visible above the fold on a 360-411px viewport)
 *   - 2 cols on tablets
 *   - 4 cols at lg
 *
 * Each card uses the shared `KpiCard` primitive: coloured icon box,
 * uppercase label, big tabular number, optional period-over-period
 * trend chip. The first card (MRR) is the primary metric and stays
 * in MyPOS Coral / teal accent.
 */
export function BillingKpis({ summary }: Props) {
  const t = useTranslations('billing');

  return (
    <div
      className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4"
      role="list"
      aria-label={t('title')}
    >
      <KpiCard
        icon={CreditCard}
        iconColor="text-teal-700 dark:text-teal-400"
        iconBg="bg-teal-50 dark:bg-teal-500/15"
        label={t('kpi_mrr')}
        value={formatUZS(summary.total_mrr_minor)}
      />
      <KpiCard
        icon={TrendingUp}
        iconColor="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-50 dark:bg-emerald-500/15"
        label={t('kpi_arr')}
        value={formatUZS(summary.arr_minor)}
      />
      <KpiCard
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-500/15"
        label={t('kpi_subscriptions')}
        value={formatNumber(summary.active_subscriptions)}
      />
      <KpiCard
        icon={Repeat}
        iconColor="text-purple-600 dark:text-purple-400"
        iconBg="bg-purple-50 dark:bg-purple-500/15"
        label={t('kpi_trial_conversion')}
        value={formatPercent(summary.trial_conversion_pct, { digits: 1 })}
        trend={{ value: summary.trial_conversion_trend_pct }}
      />
    </div>
  );
}
