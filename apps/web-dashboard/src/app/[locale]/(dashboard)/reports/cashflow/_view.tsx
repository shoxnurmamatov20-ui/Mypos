'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
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
  today,
} from '../_components/report-helpers';

type GroupBy = 'day' | 'week' | 'month';

export function CashflowReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const q = useQuery({
    queryKey: ['reports', 'cashflow', { from, to, groupBy }],
    queryFn: () =>
      reportsApi.cashflow(apiClient, {
        from: from || undefined,
        to: to || undefined,
        group_by: groupBy,
      }),
  });

  const data = q.data?.data;
  const series = data?.series ?? [];
  const byProvider = data?.by_provider ?? [];
  const summary = data?.summary;
  const net = summary?.net_minor ?? 0;
  const netTone: 'positive' | 'negative' | 'default' =
    net > 0 ? 'positive' : net < 0 ? 'negative' : 'default';

  return (
    <div className="space-y-5">
      <PageTitle>{t('cashflow_report.title')}</PageTitle>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleStat
          label={t('cashflow_report.stats_inflow')}
          value={formatUZS(summary?.total_inflow_minor ?? 0)}
          tone="positive"
        />
        <SimpleStat
          label={t('cashflow_report.stats_outflow')}
          value={formatUZS(summary?.total_outflow_minor ?? 0)}
          tone="muted"
        />
        <SimpleStat label={t('cashflow_report.stats_net')} value={formatUZS(net)} tone={netTone} />
        <SimpleStat
          label={t('cashflow_report.stats_transactions')}
          value={formatNumber(summary?.transaction_count ?? 0)}
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
        <Field label={t('cashflow_report.f_group')}>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className={inputClass}
          >
            <option value="day">{t('cashflow_report.g_day')}</option>
            <option value="week">{t('cashflow_report.g_week')}</option>
            <option value="month">{t('cashflow_report.g_month')}</option>
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
      ) : (
        <div className="space-y-6">
          {/* Series */}
          <section className="space-y-3">
            <SectionTitle>{t('cashflow_report.section_series')}</SectionTitle>
            {series.length === 0 ? (
              <EmptyCard
                icon={<Landmark className="h-6 w-6" strokeWidth={1.5} />}
                title={t('common.empty_title')}
                description={t('common.empty_hint')}
              />
            ) : (
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{t('cashflow_report.col_period')}</th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_inflow')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_outflow')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_net')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_transactions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {series.map((s) => (
                      <tr key={s.period}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[#16221f] dark:text-white">
                          {s.period}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatUZS(s.inflow_minor)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                          {formatUZS(s.outflow_minor)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                          {formatUZS(s.net_minor)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                          {formatNumber(s.transactions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            )}
          </section>

          {/* By provider */}
          <section className="space-y-3">
            <SectionTitle>{t('cashflow_report.section_providers')}</SectionTitle>
            {byProvider.length === 0 ? (
              <EmptyCard
                icon={<Landmark className="h-6 w-6" strokeWidth={1.5} />}
                title={t('common.empty_title')}
              />
            ) : (
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">
                        {t('cashflow_report.col_provider')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_amount')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_count')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('cashflow_report.col_percent')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {byProvider.map((p) => (
                      <tr key={p.provider}>
                        <td className="px-4 py-2.5 text-[#16221f] dark:text-white">{p.provider}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                          {formatUZS(p.amount_minor)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                          {formatNumber(p.count)}
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
        </div>
      )}
    </div>
  );
}
