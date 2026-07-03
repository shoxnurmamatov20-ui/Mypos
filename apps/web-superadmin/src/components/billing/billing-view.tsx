'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { SystemHealthBar } from '@/components/dashboard/system-health-bar';
import { MOCK_MRR_BY_PLAN, MOCK_MRR_SUMMARY, type MrrSummary } from '@/data/mock-billing';
import {
  type BillingSubscription,
  fetchBillingInvoices,
  fetchBillingSubscriptions,
  fetchMrrBreakdown,
  type MrrByPlanRow,
  type MrrMovement,
} from '@/lib/api-helpers';
import type { TenantPlan, TenantStatus } from '@/types/super-admin';
import { BillingKpis } from './billing-kpis';
import { InvoicesTable } from './invoices-table';
import { MrrByPlanCard } from './mrr-by-plan';
import { MrrMovement as MrrMovementCard } from './mrr-movement';
import { SubscriptionsTable } from './subscriptions-table';

type StatusFilter = TenantStatus | 'all';
type PlanFilter = TenantPlan | 'all';

/**
 * Billing landing — TanStack Query wired against
 * `/api/v1/super-admin/billing/*`. Layout:
 *   1. System health bar
 *   2. KPI strip (MRR / ARR / Active subs / Trial conversion)
 *   3. MRR Movement (waterfall + chart) + MRR-by-plan donut
 *   4. Subscriptions table (filter chips + pagination)
 *   5. Invoices table (banner — mock until backend ships)
 */
export function BillingView() {
  const t = useTranslations('billing');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [page, setPage] = useState(1);
  const perPage = 25;

  const mrrQuery = useQuery({
    queryKey: ['super-admin', 'billing', 'mrr-breakdown'],
    queryFn: fetchMrrBreakdown,
  });

  const subscriptionsQuery = useQuery({
    queryKey: [
      'super-admin',
      'billing',
      'subscriptions',
      { status: statusFilter, plan: planFilter, page, per_page: perPage },
    ],
    queryFn: () =>
      fetchBillingSubscriptions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        plan: planFilter === 'all' ? undefined : planFilter,
        page,
        per_page: perPage,
      }),
    placeholderData: (prev) => prev,
  });

  const subscriptions: BillingSubscription[] = subscriptionsQuery.data?.data ?? [];

  const invoicesQuery = useQuery({
    queryKey: ['super-admin', 'billing', 'invoices'],
    queryFn: fetchBillingInvoices,
  });
  const invoices = invoicesQuery.data?.data ?? [];

  // Compute MRR summary live from the breakdown.
  const summary: MrrSummary = useMemo(() => {
    const byPlan: MrrByPlanRow[] = mrrQuery.data?.by_plan ?? [];
    const movement: MrrMovement = mrrQuery.data?.movement_30d ?? {
      new_mrr: 0,
      expansion_mrr: 0,
      churn_mrr: 0,
      net: 0,
    };
    const totalMrrMinor = byPlan.reduce((sum, row) => sum + row.mrr_minor, 0);
    const activeSubs = byPlan.reduce((sum, row) => sum + row.tenants, 0);

    return {
      total_mrr_minor: totalMrrMinor,
      arr_minor: totalMrrMinor * 12,
      active_subscriptions: activeSubs,
      // NOTE: trial conversion + NRR/churn require dedicated endpoints —
      // surfacing the mock numbers until backend exposes them.
      trial_conversion_pct: MOCK_MRR_SUMMARY.trial_conversion_pct,
      trial_conversion_trend_pct: MOCK_MRR_SUMMARY.trial_conversion_trend_pct,
      movement_30d: {
        new_minor: movement.new_mrr,
        expansion_minor: movement.expansion_mrr,
        churn_minor: -Math.abs(movement.churn_mrr),
        net_minor: movement.net,
      },
    };
  }, [mrrQuery.data]);

  // Adapt backend MrrByPlanRow → component's MrrByPlan shape.
  const mrrByPlanRows = useMemo(() => {
    const rows = mrrQuery.data?.by_plan ?? [];
    const total = rows.reduce((s, r) => s + r.mrr_minor, 0) || 1;
    return rows.map((r) => ({
      plan: r.plan as TenantPlan,
      count: r.tenants,
      mrr_minor: r.mrr_minor,
      share_pct: Math.round((r.mrr_minor / total) * 1000) / 10,
    }));
  }, [mrrQuery.data]);

  // Adapt backend BillingSubscription → SubscriptionRow shape the table needs.
  const subscriptionRows = useMemo(
    () =>
      subscriptions.map((sub) => ({
        tenant_id: sub.id,
        tenant_name: sub.name,
        plan: sub.plan as TenantPlan,
        status: sub.status as TenantStatus,
        mrr_minor: sub.mrr_minor,
        renews_at: sub.subscription_ends_at ?? sub.created_at,
        last_invoice_at: sub.subscription_ends_at ?? sub.created_at,
      })),
    [subscriptions],
  );

  // Synthetic movement series for the bar chart — until backend exposes daily breakdown.
  const movementPoints = useMemo(() => {
    const days = 30;
    const movement = mrrQuery.data?.movement_30d;
    if (!movement) return [];
    const newPerDay = Math.round(movement.new_mrr / days);
    const expPerDay = Math.round(movement.expansion_mrr / days);
    const churnPerDay = Math.round(Math.abs(movement.churn_mrr) / days);
    return Array.from({ length: days }, (_, idx) => {
      const day = Date.now() - (days - 1 - idx) * 86_400_000;
      return {
        date: new Date(day).toISOString().slice(0, 10),
        new_minor: Math.max(0, Math.round(newPerDay * (0.7 + Math.sin(idx / 3) * 0.3))),
        expansion_minor: Math.max(0, Math.round(expPerDay * (0.7 + Math.cos(idx / 3) * 0.3))),
        churn_minor: Math.max(0, Math.round(churnPerDay * (0.7 + Math.sin(idx / 2.4 + 1) * 0.3))),
      };
    });
  }, [mrrQuery.data]);

  const total = subscriptionsQuery.data?.meta?.total ?? subscriptionRows.length;
  const lastPage = subscriptionsQuery.data?.meta?.last_page ?? 1;
  const isLoadingAll = mrrQuery.isPending && subscriptionsQuery.isPending;
  const isErrorAll = mrrQuery.isError && subscriptionsQuery.isError;

  if (isLoadingAll) {
    return <BillingSkeleton />;
  }

  if (isErrorAll) {
    return (
      <ErrorState
        title={t('error_load_failed')}
        retryLabel={t('error_retry')}
        message={t('subtitle')}
        onRetry={() => {
          void mrrQuery.refetch();
          void subscriptionsQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-4 md:space-y-6">
      <SystemHealthBar />

      {/* Page heading */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
      </div>

      <BillingKpis summary={summary} />

      {/* min-w-0 on every grid child lets Recharts SVGs shrink instead of
          forcing the row wider than the viewport — otherwise the chart's
          natural min-content makes the parent overflow on phones, pushing
          UZS values past the card's right edge. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 min-w-0">
          <MrrMovementCard summary={summary} movement={movementPoints} />
        </div>
        <div className="min-w-0">
          <MrrByPlanCard
            rows={mrrByPlanRows.length > 0 ? mrrByPlanRows : MOCK_MRR_BY_PLAN}
            compact
          />
        </div>
      </div>

      <SubscriptionsTable
        rows={subscriptionRows}
        statusFilter={statusFilter}
        planFilter={planFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        onPlanChange={(v) => {
          setPlanFilter(v);
          setPage(1);
        }}
        page={page}
        lastPage={lastPage}
        total={total}
        onPageChange={setPage}
        isLoading={subscriptionsQuery.isFetching}
      />

      {/* INVOICES — live ledger (empty until the billing engine lands) */}
      {invoices.length === 0 && !invoicesQuery.isPending ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300/60 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3"
        >
          <Info
            className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
            aria-hidden="true"
          />
          <span>{t('invoices_empty_note')}</span>
        </div>
      ) : null}
      <InvoicesTable invoices={invoices} />
    </section>
  );
}

function BillingSkeleton() {
  return (
    <section className="space-y-4 md:space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
      <div>
        <div className="h-7 w-48 rounded bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 h-72 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 animate-pulse" />
        <div className="h-72 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 animate-pulse" />
      </div>
      <div className="h-72 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 animate-pulse" />
    </section>
  );
}

function ErrorState({
  title,
  retryLabel,
  message,
  onRetry,
}: {
  title: string;
  retryLabel: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-300/60 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-8 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
        <AlertCircle
          className="h-6 w-6 text-red-600 dark:text-red-400"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-base font-bold text-red-900 dark:text-red-200">{title}</p>
        <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-500/40 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-red-700 dark:text-red-300 transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        {retryLabel}
      </button>
    </div>
  );
}
