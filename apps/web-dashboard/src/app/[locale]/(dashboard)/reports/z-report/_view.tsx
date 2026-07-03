'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
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
  SectionTitle,
  SimpleStat,
  TableShell,
  TopRankList,
  today,
} from '../_components/report-helpers';

export function ZReportView() {
  const t = useTranslations('reports_pages');
  const [date, setDate] = useState<string>(today());

  const q = useQuery({
    queryKey: ['reports', 'z-report', date],
    queryFn: () => reportsApi.zReport(apiClient, { date }),
  });

  const report = q.data?.data;
  const totals = report?.totals;
  const completed = report?.by_status?.completed ?? 0;
  const topHeaders = {
    rank: t('z_report.col_rank'),
    name: t('z_report.col_name'),
    quantity: t('z_report.col_quantity'),
    revenue: t('z_report.col_revenue'),
  };

  return (
    <div className="space-y-5">
      <PageTitle>{t('z_report.title')}</PageTitle>

      {/* Header: date picker + quick buttons */}
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <button
          type="button"
          onClick={() => setDate(today())}
          className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:bg-transparent dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]"
        >
          {t('common.today')}
        </button>
        <button
          type="button"
          onClick={() => setDate(daysAgo(1))}
          className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:bg-transparent dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]"
        >
          {t('common.yesterday')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleStat
          label={t('z_report.stats_orders')}
          value={formatNumber(totals?.orders_count ?? 0)}
        />
        <SimpleStat
          label={t('z_report.stats_revenue')}
          value={formatUZS(totals?.revenue_minor ?? 0)}
        />
        <SimpleStat
          label={t('z_report.stats_avg_ticket')}
          value={formatUZS(totals?.avg_ticket_minor ?? 0)}
        />
        <SimpleStat label={t('z_report.stats_completed')} value={formatNumber(completed)} />
      </div>

      {q.isLoading ? (
        <LoadingHint label={t('common.loading')} />
      ) : q.isError ? (
        <ErrorBanner
          message={t('common.load_failed')}
          onRetry={() => q.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : !report ? null : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* By status */}
          <section className="space-y-3">
            <SectionTitle>{t('z_report.section_by_status')}</SectionTitle>
            <TableShell>
              <table className="w-full text-sm">
                <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">{t('z_report.col_status')}</th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      {t('z_report.col_count')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                  {Object.entries(report.by_status).map(([status, count]) => (
                    <tr key={status}>
                      <td className="px-4 py-2.5 text-[#16221f] dark:text-white">{status}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                        {formatNumber(count ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </section>

          {/* Payments */}
          <section className="space-y-3">
            <SectionTitle>{t('z_report.section_payments')}</SectionTitle>
            {report.payments.length === 0 ? (
              <EmptyCard
                icon={<FileText className="h-6 w-6" strokeWidth={1.5} />}
                title={t('common.empty_title')}
              />
            ) : (
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{t('z_report.col_provider')}</th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('z_report.col_count')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('z_report.col_amount')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('z_report.col_percent')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {report.payments.map((p) => (
                      <tr key={p.provider}>
                        <td className="px-4 py-2.5 text-[#16221f] dark:text-white">{p.provider}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                          {formatNumber(p.count)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                          {formatUZS(p.amount_minor)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                          {p.percent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            )}
          </section>

          {/* Top items */}
          <section className="space-y-3">
            <SectionTitle>{t('z_report.section_top_items')}</SectionTitle>
            <TopRankList
              rows={report.top_items.slice(0, 5).map((it, i) => ({
                rank: i + 1,
                name: it.name || '—',
                count: formatNumber(it.quantity_sold),
                revenue: formatUZS(it.revenue_minor),
              }))}
              headers={topHeaders}
              emptyTitle={t('common.empty_title')}
              emptyIcon={<FileText className="h-6 w-6" strokeWidth={1.5} />}
            />
          </section>

          {/* Top waiters */}
          <section className="space-y-3">
            <SectionTitle>{t('z_report.section_top_waiters')}</SectionTitle>
            <TopRankList
              rows={report.top_waiters.slice(0, 5).map((w, i) => ({
                rank: i + 1,
                name: w.name || '—',
                count: formatNumber(w.orders_count),
                revenue: formatUZS(w.revenue_minor),
              }))}
              headers={topHeaders}
              emptyTitle={t('common.empty_title')}
              emptyIcon={<FileText className="h-6 w-6" strokeWidth={1.5} />}
            />
          </section>

          {/* Cancellations */}
          <section className="space-y-3 lg:col-span-2">
            <SectionTitle>{t('z_report.section_cancellations')}</SectionTitle>
            <div className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white p-4 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
              <p className="text-sm text-[#16221f] dark:text-white">
                {t('z_report.cancellations_count', { count: report.cancellations.count })}
              </p>
              <p className="mt-1 text-xs text-[#62716d] dark:text-[#94a3b8]">
                {t('z_report.cancellations_loss', {
                  amount: formatUZS(report.cancellations.estimated_loss_minor),
                })}
              </p>
              {report.cancellations.reasons.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-[#62716d] dark:text-[#94a3b8]">
                  {report.cancellations.reasons.slice(0, 6).map((r) => (
                    <li key={r.reason} className="flex justify-between gap-3">
                      <span className="truncate">{r.reason}</span>
                      <span className="tabular-nums">{r.count}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
