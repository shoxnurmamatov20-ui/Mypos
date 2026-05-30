'use client';

import { Calendar, TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ceoFetch, type FinancesResponse } from '@/lib/api';
import { formatCompactUZS } from '@/lib/format';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type Data = FinancesResponse['data'];

export function FinancesClient({ locale }: { locale: string }) {
  const t = useTranslations('finances');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ceoFetch<FinancesResponse>('/api/v1/ceo/finances/summary')
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((e) => {
        if (cancelled) return;
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <div className="space-y-3.5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
          {error}
        </div>
      ) : !data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[112px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse" />
        </>
      ) : (
        <Loaded data={data} t={t} />
      )}
    </div>
  );
}

function Loaded({ data, t }: { data: Data; t: ReturnType<typeof useTranslations> }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={TrendingUp}
          iconColor="text-[#18794e]"
          iconBg="bg-[rgba(24,121,78,0.10)]"
          label={t('mrr')}
          value={formatCompactUZS(data.mrr_minor)}
          hint={t('mrr_hint')}
        />
        <KpiCard
          icon={Calendar}
          iconColor="text-[#2563eb]"
          iconBg="bg-[rgba(37,99,235,0.10)]"
          label={t('last_30_days')}
          value={formatCompactUZS(data.last_30_days_revenue_minor)}
          hint={t('last_30_days_hint')}
        />
        <KpiCard
          icon={Wallet}
          iconColor="text-[#6366f1]"
          iconBg="bg-[rgba(99,102,241,0.10)]"
          label={t('lifetime_revenue')}
          value={formatCompactUZS(data.lifetime_revenue_minor)}
          hint={t('lifetime_revenue_hint')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle hint={t('by_tenant_hint')}>{t('by_tenant')}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                <th className="text-left pb-2.5 font-bold">{t('th_restaurant')}</th>
                <th className="text-left pb-2.5 font-bold">{t('th_plan')}</th>
                <th className="text-right pb-2.5 font-bold">{t('th_mrr')}</th>
                <th className="text-right pb-2.5 font-bold">{t('th_lifetime')}</th>
              </tr>
            </thead>
            <tbody>
              {data.by_tenant.length === 0 ? (
                <tr className="border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                  <td
                    colSpan={4}
                    className="py-6 text-center text-[12px] text-[#62716d] dark:text-[#94a3b8]"
                  >
                    {t('by_tenant_empty')}
                  </td>
                </tr>
              ) : (
                data.by_tenant.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]"
                  >
                    <td className="py-2.5 font-semibold text-[#16221f] dark:text-white">
                      {row.name}
                    </td>
                    <td className="py-2.5 text-[#62716d] dark:text-[#94a3b8] uppercase">
                      {row.subscription_plan ?? '—'}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                      {formatCompactUZS(row.mrr_minor)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatCompactUZS(row.lifetime_revenue_minor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
