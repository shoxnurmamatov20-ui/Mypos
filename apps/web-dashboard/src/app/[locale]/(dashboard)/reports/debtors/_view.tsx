'use client';

import { reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  daysAgo,
  EmptyCard,
  ErrorBanner,
  Field,
  formatDate,
  formatNumber,
  inputClass,
  LoadingHint,
  PageTitle,
  SectionTitle,
  SimpleStat,
  TableShell,
  today,
} from '../_components/report-helpers';

export function DebtorsReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(90));
  const [to, setTo] = useState(today());

  const q = useQuery({
    queryKey: ['reports', 'debtors', { from, to }],
    queryFn: () =>
      reportsApi.debtors(apiClient, {
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const data = q.data?.data;
  const debtors = data?.debtors ?? [];
  const summary = data?.summary;
  const net = summary?.net_minor ?? 0;
  const netTone: 'positive' | 'negative' | 'default' =
    net > 0 ? 'positive' : net < 0 ? 'negative' : 'default';

  return (
    <div className="space-y-5">
      <PageTitle>{t('debtors_report.title')}</PageTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat
          label={t('debtors_report.stats_debtors')}
          value={formatUZS(summary?.debtors_total_minor ?? 0)}
        />
        <SimpleStat
          label={t('debtors_report.stats_creditors')}
          value={formatUZS(summary?.creditors_total_minor ?? 0)}
          tone="muted"
        />
        <SimpleStat label={t('debtors_report.stats_net')} value={formatUZS(net)} tone={netTone} />
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
          {/* Debtors */}
          <section className="space-y-3">
            <SectionTitle>{t('debtors_report.section_debtors')}</SectionTitle>
            {debtors.length === 0 ? (
              <EmptyCard
                icon={<Handshake className="h-6 w-6" strokeWidth={1.5} />}
                title={t('common.empty_title')}
                description={t('common.empty_hint')}
              />
            ) : (
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{t('debtors_report.col_name')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('debtors_report.col_phone')}</th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('debtors_report.col_orders')}
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        {t('debtors_report.col_owed')}
                      </th>
                      <th className="px-4 py-2.5 font-medium">{t('debtors_report.col_oldest')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {debtors.map((d) => (
                      <tr
                        key={d.customer_id}
                        className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40"
                      >
                        <td className="px-4 py-2.5 font-medium text-[#16221f] dark:text-white">
                          {d.name}
                        </td>
                        <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                          {d.phone ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                          {formatNumber(d.orders_count)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatUZS(d.total_owed_minor)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                          {formatDate(d.oldest_unpaid_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            )}
          </section>

          {/* Creditors (reserved) */}
          <section className="space-y-3">
            <SectionTitle>{t('debtors_report.section_creditors')}</SectionTitle>
            <div className="rounded-lg border border-dashed border-[rgba(22,34,31,0.15)] bg-white px-4 py-8 text-center text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.10)] dark:bg-[#111827] dark:text-[#94a3b8]">
              {t('debtors_report.creditors_empty')}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
