'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  EmptyCard,
  ErrorBanner,
  Field,
  LoadingHint,
  PageTitle,
  SectionTitle,
  SimpleStat,
  TableShell,
  daysAgo,
  formatDateTime,
  formatNumber,
  inputClass,
  today,
} from '../_components/report-helpers';

export function CancelledReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());

  const q = useQuery({
    queryKey: ['reports', 'cancelled', { from, to }],
    queryFn: () =>
      reportsApi.cancelled(apiClient, {
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const data = q.data?.data;
  const orders = data?.orders ?? [];
  const byReason = data?.by_reason ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <PageTitle>{t('cancelled_report.title')}</PageTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat label={t('cancelled_report.stats_orders')} value={formatNumber(summary?.orders_count ?? 0)} />
        <SimpleStat label={t('cancelled_report.stats_items')} value={formatNumber(summary?.items_count ?? 0)} />
        <SimpleStat
          label={t('cancelled_report.stats_loss')}
          value={formatUZS(summary?.total_loss_minor ?? 0)}
          tone="negative"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('common.to_date')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </Field>
      </div>

      {q.isLoading ? (
        <LoadingHint label={t('common.loading')} />
      ) : q.isError ? (
        <ErrorBanner message={t('common.load_failed')} onRetry={() => q.refetch()} retryLabel={t('common.retry')} />
      ) : (
        <div className="space-y-6">
          {/* Section A: Cancelled orders */}
          <section className="space-y-3">
            <SectionTitle>{t('cancelled_report.section_orders')}</SectionTitle>
            {orders.length === 0 ? (
              <EmptyCard
                icon={<XCircle className="h-6 w-6" strokeWidth={1.5} />}
                title={t('common.empty_title')}
              />
            ) : (
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{t('cancelled_report.col_order_no')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cancelled_report.col_table')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cancelled_report.col_waiter')}</th>
                      <th className="px-4 py-2.5 font-medium text-right">{t('cancelled_report.col_total')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cancelled_report.col_cancelled_at')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cancelled_report.col_reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {orders.map((o) => (
                      <tr key={o.order_id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                        <td className="px-4 py-2.5 font-medium text-[#16221f] dark:text-white">
                          {o.order_no}
                        </td>
                        <td className="px-4 py-2.5 text-[#16221f] dark:text-white">
                          {o.table_name ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                          {o.waiter_name ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-rose-600 dark:text-rose-400">
                          {formatUZS(o.total_minor)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                          {formatDateTime(o.cancelled_at)}
                        </td>
                        <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                          <span className="truncate" title={o.cancel_reason}>
                            {o.cancel_reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            )}
          </section>

          {/* Section B: By reason */}
          <section className="space-y-3">
            <SectionTitle>{t('cancelled_report.section_reasons')}</SectionTitle>
            {byReason.length === 0 ? (
              <EmptyCard
                icon={<XCircle className="h-6 w-6" strokeWidth={1.5} />}
                title={t('common.empty_title')}
              />
            ) : (
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{t('cancelled_report.col_reason')}</th>
                      <th className="px-4 py-2.5 font-medium text-right">{t('cancelled_report.col_count')}</th>
                      <th className="px-4 py-2.5 font-medium text-right">{t('cancelled_report.col_loss')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {byReason.map((r) => (
                      <tr key={r.reason}>
                        <td className="px-4 py-2.5 text-[#16221f] dark:text-white">{r.reason}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                          {formatNumber(r.count)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-rose-600 dark:text-rose-400">
                          {formatUZS(r.loss_minor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
