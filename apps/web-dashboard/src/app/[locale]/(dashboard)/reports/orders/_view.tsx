'use client';

import { type OrdersReportItem, reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  daysAgo,
  EmptyCard,
  ErrorBanner,
  Field,
  formatDateTime,
  formatNumber,
  inputClass,
  LoadingHint,
  PageTitle,
  SimpleStat,
  TableShell,
  today,
} from '../_components/report-helpers';

export function OrdersReportView() {
  const t = useTranslations('reports_pages');

  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 30;

  const query = useQuery({
    queryKey: ['reports', 'orders', { from, to, status, type, paymentMethod, q, page }],
    queryFn: () =>
      reportsApi.orders(apiClient, {
        from: from || undefined,
        to: to || undefined,
        status: status ? (status as never) : undefined,
        type: type ? (type as never) : undefined,
        payment_method: paymentMethod || undefined,
        q: q || undefined,
        page,
        per_page: perPage,
        sort: '-placed_at',
      }),
  });

  const rows = (query.data?.data ?? []) as OrdersReportItem[];
  const meta = query.data?.meta;
  const summary = meta?.summary;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">
      <PageTitle>{t('orders_report.title')}</PageTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat
          label={t('orders_report.stats_count')}
          value={formatNumber(summary?.count ?? 0)}
        />
        <SimpleStat
          label={t('orders_report.stats_revenue')}
          value={formatUZS(summary?.revenue_minor ?? 0)}
        />
        <SimpleStat
          label={t('orders_report.stats_avg')}
          value={formatUZS(summary?.avg_ticket_minor ?? 0)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              resetPage();
            }}
            className={inputClass}
          />
        </Field>
        <Field label={t('common.to_date')}>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              resetPage();
            }}
            className={inputClass}
          />
        </Field>
        <Field label={t('orders_report.f_status')}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className={inputClass}
          >
            <option value="">{t('common.all')}</option>
            <option value="pending">pending</option>
            <option value="preparing">preparing</option>
            <option value="ready">ready</option>
            <option value="served">served</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="refunded">refunded</option>
          </select>
        </Field>
        <Field label={t('orders_report.f_type')}>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              resetPage();
            }}
            className={inputClass}
          >
            <option value="">{t('common.all')}</option>
            <option value="dine_in">dine_in</option>
            <option value="takeaway">takeaway</option>
            <option value="delivery">delivery</option>
            <option value="qr">qr</option>
          </select>
        </Field>
        <Field label={t('orders_report.f_payment')}>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              resetPage();
            }}
            className={inputClass}
          >
            <option value="">{t('common.all')}</option>
            <option value="cash">cash</option>
            <option value="card">card</option>
            <option value="click">click</option>
            <option value="payme">payme</option>
            <option value="uzum">uzum</option>
          </select>
        </Field>
        <Field label={t('orders_report.f_search')}>
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
            placeholder={t('orders_report.search_placeholder')}
            className={inputClass}
          />
        </Field>
      </div>

      {query.isLoading ? (
        <LoadingHint label={t('common.loading')} />
      ) : query.isError ? (
        <ErrorBanner
          message={t('common.load_failed')}
          onRetry={() => query.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : rows.length === 0 ? (
        <EmptyCard
          icon={<ClipboardList className="h-6 w-6" strokeWidth={1.5} />}
          title={t('common.empty_title')}
          description={t('common.empty_hint')}
        />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_order_no')}</th>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_placed_at')}</th>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_type')}</th>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_table')}</th>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_waiter')}</th>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_status')}</th>
                <th className="px-4 py-2.5 font-medium">{t('orders_report.col_payment')}</th>
                <th className="px-4 py-2.5 font-medium text-right">
                  {t('orders_report.col_total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                  <td className="px-4 py-2.5 font-medium text-[#16221f] dark:text-white">
                    {o.order_no}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                    {formatDateTime(o.placed_at ?? o.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">{o.type}</td>
                  <td className="px-4 py-2.5 text-[#16221f] dark:text-white">
                    {o.table?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[#16221f] dark:text-white">
                    {o.waiter?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                    {o.payment_method ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                    {formatUZS(o.amounts.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {lastPage > 1 ? (
            <div className="flex items-center justify-between border-t border-[rgba(22,34,31,0.06)] px-4 py-2.5 text-xs text-[#62716d] dark:border-[rgba(255,255,255,0.05)] dark:text-[#94a3b8]">
              <span>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[#62716d] hover:bg-[#eef4f3] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#1a2235] outline-none focus:outline-none"
                  aria-label={t('common.prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">{t('common.page_of', { page, total: lastPage })}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[#62716d] hover:bg-[#eef4f3] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#1a2235] outline-none focus:outline-none"
                  aria-label={t('common.next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </TableShell>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {status}
    </span>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case 'completed':
    case 'served':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
    case 'cancelled':
    case 'refunded':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400';
    case 'preparing':
    case 'pending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400';
    case 'ready':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400';
    default:
      return 'bg-[#eef4f3] text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]';
  }
}
