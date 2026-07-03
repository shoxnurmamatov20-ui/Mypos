'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { Bike, Lock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  daysAgo,
  EmptyCard,
  ErrorBanner,
  Field,
  formatNumber,
  inputClass,
  LoadingHint,
  PageTitle,
  SimpleStat,
  TableShell,
  today,
} from '../_components/report-helpers';

export function CourierReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());

  const q = useQuery({
    queryKey: ['reports', 'courier', { from, to }],
    queryFn: () =>
      reportsApi.courier(apiClient, {
        from: from || undefined,
        to: to || undefined,
        sort: '-deliveries',
      }),
  });

  const meta = q.data?.meta;
  const rows = q.data?.data ?? [];
  const isLocked = meta?.locked === true;

  return (
    <div className="space-y-5">
      <PageTitle>{t('courier_report.title')}</PageTitle>

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={isLocked}
            className={inputClass}
          />
        </Field>
        <Field label={t('common.to_date')}>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isLocked}
            className={inputClass}
          />
        </Field>
      </div>

      {q.isLoading ? (
        <LoadingHint label={t('common.loading')} />
      ) : q.isError ? (
        <ErrorBanner
          message={t('common.load_failed')}
          onRetry={() => q.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : isLocked ? (
        <LockedCard
          title={t('courier_report.locked_title')}
          description={t('courier_report.locked_desc')}
          ctaLabel={t('courier_report.locked_cta')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SimpleStat
              label={t('courier_report.stats_couriers')}
              value={formatNumber(
                'couriers_count' in (meta ?? {})
                  ? ((meta as { couriers_count?: number }).couriers_count ?? 0)
                  : 0,
              )}
            />
            <SimpleStat
              label={t('courier_report.stats_deliveries')}
              value={formatNumber(
                'total_deliveries' in (meta ?? {})
                  ? ((meta as { total_deliveries?: number }).total_deliveries ?? 0)
                  : 0,
              )}
            />
            <SimpleStat
              label={t('courier_report.stats_revenue')}
              value={formatUZS(
                'total_revenue_minor' in (meta ?? {})
                  ? ((meta as { total_revenue_minor?: number }).total_revenue_minor ?? 0)
                  : 0,
              )}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyCard
              icon={<Bike className="h-6 w-6" strokeWidth={1.5} />}
              title={t('common.empty_title')}
              description={t('common.empty_hint')}
            />
          ) : (
            <TableShell>
              <table className="w-full text-sm">
                <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">{t('courier_report.col_name')}</th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      {t('courier_report.col_deliveries')}
                    </th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      {t('courier_report.col_avg_minutes')}
                    </th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      {t('courier_report.col_revenue')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                  {rows.map((c) => (
                    <tr
                      key={c.courier_id}
                      className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40"
                    >
                      <td className="px-4 py-2.5 font-medium text-[#16221f] dark:text-white">
                        {c.name}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                        {formatNumber(c.deliveries_count)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                        {c.avg_delivery_minutes.toFixed(1)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                        {formatUZS(c.revenue_delivered_minor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </>
      )}
    </div>
  );
}

function LockedCard({
  title,
  description,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center">
      <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        <Lock className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
          {description}
        </p>
      </div>
      <Link
        href="/uz/settings"
        className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
