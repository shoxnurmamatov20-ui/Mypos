'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { UsersRound } from 'lucide-react';
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

export function WaitersReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [sort, setSort] = useState<'-revenue' | '-orders' | '-tips'>('-revenue');

  const q = useQuery({
    queryKey: ['reports', 'waiters', { from, to, sort }],
    queryFn: () =>
      reportsApi.waiters(apiClient, {
        from: from || undefined,
        to: to || undefined,
        sort,
      }),
  });

  const rows = q.data?.data ?? [];
  const meta = q.data?.meta;
  const topRevenue = rows.length > 0 ? Math.max(...rows.map((r) => r.revenue_minor)) : 0;

  return (
    <div className="space-y-5">
      <PageTitle>{t('waiters_report.title')}</PageTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat
          label={t('waiters_report.stats_total')}
          value={formatNumber(meta?.employees_count ?? 0)}
        />
        <SimpleStat
          label={t('waiters_report.stats_orders')}
          value={formatNumber(meta?.total_orders_count ?? 0)}
        />
        <SimpleStat
          label={t('waiters_report.stats_revenue')}
          value={formatUZS(meta?.total_revenue_minor ?? 0)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('common.to_date')}>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('common.sort')}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className={inputClass}
          >
            <option value="-revenue">{t('waiters_report.sort_revenue_desc')}</option>
            <option value="-orders">{t('waiters_report.sort_orders_desc')}</option>
            <option value="-tips">{t('waiters_report.sort_tips_desc')}</option>
          </select>
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
      ) : rows.length === 0 ? (
        <EmptyCard
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.5} />}
          title={t('common.empty_title')}
          description={t('common.empty_hint')}
        />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t('waiters_report.col_name')}</th>
                <th className="px-4 py-2.5 font-medium">{t('waiters_report.col_position')}</th>
                <th className="px-4 py-2.5 font-medium text-right">
                  {t('waiters_report.col_orders')}
                </th>
                <th className="px-4 py-2.5 font-medium text-right">
                  {t('waiters_report.col_avg')}
                </th>
                <th className="px-4 py-2.5 font-medium text-right">
                  {t('waiters_report.col_tips')}
                </th>
                <th className="px-4 py-2.5 font-medium text-right">
                  {t('waiters_report.col_revenue')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {rows.map((r) => {
                const isTop = r.revenue_minor === topRevenue && topRevenue > 0;
                return (
                  <tr key={r.employee_id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#16221f] dark:text-white">{r.name}</span>
                        {isTop ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                            TOP
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                      {r.position || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                      {formatNumber(r.orders_count)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatUZS(r.avg_ticket_minor)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatUZS(r.tips_minor)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                      {formatUZS(r.revenue_minor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
