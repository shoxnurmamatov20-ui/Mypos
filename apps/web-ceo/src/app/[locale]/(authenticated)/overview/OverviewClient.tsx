'use client';

import { Calendar, Store, TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ceoFetch, type DashboardResponse } from '@/lib/api';
import { formatCompactUZS, formatNumber } from '@/lib/format';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type Data = DashboardResponse['data'];

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: Data };

export function OverviewClient({ locale }: { locale: string }) {
  const t = useTranslations('overview');
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    ceoFetch<DashboardResponse>('/api/v1/ceo/dashboard')
      .then((res) => {
        if (!cancelled) setState({ kind: 'success', data: res.data });
      })
      .catch((e) => {
        if (cancelled) return;
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setState({ kind: 'error', message: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <div className="space-y-3.5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {state.kind === 'loading' ? <LoadingGrid /> : null}
      {state.kind === 'error' ? <ErrorCard message={state.message} /> : null}
      {state.kind === 'success' ? <Loaded data={state.data} t={t} /> : null}
    </div>
  );
}

function Loaded({ data, t }: { data: Data; t: ReturnType<typeof useTranslations> }) {
  const { metrics } = data;
  const max30 = Math.max(metrics.last_30_days.revenue_minor, 1);
  const pct = (n: number) => Math.min(100, Math.round((n / max30) * 100));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard
          label={t('tenants_owned')}
          value={formatNumber(data.tenants_owned)}
          sub={t('tenants_owned_sub')}
          icon={Store}
          accent="blue"
          fillPct={Math.min(100, data.tenants_owned * 12)}
        />
        <StatCard
          label={t('today_revenue')}
          value={formatCompactUZS(metrics.today.revenue_minor)}
          sub={t('orders_count', { count: metrics.today.orders_count })}
          icon={TrendingUp}
          accent="green"
          fillPct={pct(metrics.today.revenue_minor)}
        />
        <StatCard
          label={t('last_7_days')}
          value={formatCompactUZS(metrics.last_7_days.revenue_minor)}
          sub={t('orders_count', { count: metrics.last_7_days.orders_count })}
          icon={Calendar}
          accent="teal"
          fillPct={pct(metrics.last_7_days.revenue_minor)}
        />
        <StatCard
          label={t('last_30_days')}
          value={formatCompactUZS(metrics.last_30_days.revenue_minor)}
          sub={t('orders_count', { count: metrics.last_30_days.orders_count })}
          icon={Wallet}
          accent="indigo"
          fillPct={100}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle hint={t('period_breakdown_hint')}>{t('period_breakdown')}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                <th className="text-left pb-2.5 font-bold">{t('th_period')}</th>
                <th className="text-right pb-2.5 font-bold">{t('th_revenue')}</th>
                <th className="text-right pb-2.5 font-bold">{t('th_orders')}</th>
              </tr>
            </thead>
            <tbody>
              <PeriodRow
                label={t('today_revenue')}
                revenue={metrics.today.revenue_minor}
                orders={metrics.today.orders_count}
              />
              <PeriodRow
                label={t('last_7_days')}
                revenue={metrics.last_7_days.revenue_minor}
                orders={metrics.last_7_days.orders_count}
              />
              <PeriodRow
                label={t('last_30_days')}
                revenue={metrics.last_30_days.revenue_minor}
                orders={metrics.last_30_days.orders_count}
              />
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function PeriodRow({ label, revenue, orders }: { label: string; revenue: number; orders: number }) {
  return (
    <tr className="border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]">
      <td className="py-2.5 font-semibold text-[#16221f] dark:text-white">{label}</td>
      <td className="py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
        {formatCompactUZS(revenue)}
      </td>
      <td className="py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
        {formatNumber(orders)}
      </td>
    </tr>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="h-[116px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
      {message}
    </div>
  );
}
