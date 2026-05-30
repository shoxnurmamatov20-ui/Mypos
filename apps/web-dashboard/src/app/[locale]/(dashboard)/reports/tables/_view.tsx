'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  EmptyCard,
  ErrorBanner,
  Field,
  LoadingHint,
  PageTitle,
  SimpleStat,
  TableShell,
  daysAgo,
  formatDateTime,
  formatNumber,
  inputClass,
  today,
} from '../_components/report-helpers';

export function TablesReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [sort, setSort] = useState<'-revenue' | '-orders' | '-occupancy'>('-revenue');

  const q = useQuery({
    queryKey: ['reports', 'tables', { from, to, sort }],
    queryFn: () =>
      reportsApi.tables(apiClient, {
        from: from || undefined,
        to: to || undefined,
        sort,
      }),
  });

  const rows = q.data?.data ?? [];
  const meta = q.data?.meta;

  return (
    <div className="space-y-5">
      <PageTitle>{t('tables_report.title')}</PageTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat label={t('tables_report.stats_total')} value={formatNumber(meta?.total_tables ?? 0)} />
        <SimpleStat label={t('tables_report.stats_active')} value={formatNumber(meta?.active_tables ?? 0)} />
        <SimpleStat label={t('tables_report.stats_revenue')} value={formatUZS(meta?.total_revenue_minor ?? 0)} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('common.to_date')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('common.sort')}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className={inputClass}
          >
            <option value="-revenue">{t('tables_report.sort_revenue_desc')}</option>
            <option value="-orders">{t('tables_report.sort_orders_desc')}</option>
            <option value="-occupancy">{t('tables_report.sort_occupancy_desc')}</option>
          </select>
        </Field>
      </div>

      {q.isLoading ? (
        <LoadingHint label={t('common.loading')} />
      ) : q.isError ? (
        <ErrorBanner message={t('common.load_failed')} onRetry={() => q.refetch()} retryLabel={t('common.retry')} />
      ) : rows.length === 0 ? (
        <EmptyCard
          icon={<Store className="h-6 w-6" strokeWidth={1.5} />}
          title={t('common.empty_title')}
          description={t('common.empty_hint')}
        />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t('tables_report.col_name')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('tables_report.col_orders')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('tables_report.col_guests')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('tables_report.col_avg')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('tables_report.col_revenue')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('tables_report.col_occupancy')}</th>
                <th className="px-4 py-2.5 font-medium">{t('tables_report.col_last_used')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {rows.map((r) => (
                <tr key={r.table_id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#16221f] dark:text-white">{r.name}</span>
                      {r.category ? (
                        <span className="rounded-full bg-[#eef4f3] px-2 py-0.5 text-[10.5px] font-medium text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
                          {r.category}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                    {formatNumber(r.orders_count)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {formatNumber(r.guests_total)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {formatUZS(r.avg_ticket_minor)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                    {formatUZS(r.revenue_minor)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {formatNumber(r.occupancy_minutes, 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                    {formatDateTime(r.last_used_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
