'use client';

import { menuApi, reportsApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed } from 'lucide-react';
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
  formatNumber,
  inputClass,
  today,
} from '../_components/report-helpers';

type MenuSort = '-revenue' | '-quantity' | 'revenue' | 'quantity';

export function MenuItemsReportView() {
  const t = useTranslations('reports_pages');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState<MenuSort>('-revenue');

  const categoriesQuery = useQuery({
    queryKey: ['menu', 'categories', 'all'],
    queryFn: () => menuApi.categories.list(apiClient, { active_only: true }),
    staleTime: 5 * 60_000,
  });
  const categories = categoriesQuery.data?.data ?? [];

  const q = useQuery({
    queryKey: ['reports', 'menu-items', { from, to, categoryId, sort }],
    queryFn: () =>
      reportsApi.menuItems(apiClient, {
        from: from || undefined,
        to: to || undefined,
        category_id: categoryId || undefined,
        sort,
      }),
  });

  const rows = q.data?.data ?? [];
  const meta = q.data?.meta;

  return (
    <div className="space-y-5">
      <PageTitle>{t('menu_items_report.title')}</PageTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat label={t('menu_items_report.stats_sold')} value={formatNumber(meta?.total_items_sold ?? 0)} />
        <SimpleStat label={t('menu_items_report.stats_revenue')} value={formatUZS(meta?.total_revenue_minor ?? 0)} />
        <SimpleStat
          label={t('menu_items_report.stats_profit')}
          value={formatUZS(meta?.total_profit_minor ?? 0)}
          tone={(meta?.total_profit_minor ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('common.from_date')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('common.to_date')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('menu_items_report.f_category')}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">{t('common.all')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.uz}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('common.sort')}>
          <select value={sort} onChange={(e) => setSort(e.target.value as MenuSort)} className={inputClass}>
            <option value="-revenue">{t('menu_items_report.sort_revenue_desc')}</option>
            <option value="-quantity">{t('menu_items_report.sort_quantity_desc')}</option>
            <option value="quantity">{t('menu_items_report.sort_quantity_asc')}</option>
            <option value="revenue">{t('menu_items_report.sort_revenue_asc')}</option>
          </select>
        </Field>
      </div>

      {q.isLoading ? (
        <LoadingHint label={t('common.loading')} />
      ) : q.isError ? (
        <ErrorBanner message={t('common.load_failed')} onRetry={() => q.refetch()} retryLabel={t('common.retry')} />
      ) : rows.length === 0 ? (
        <EmptyCard
          icon={<UtensilsCrossed className="h-6 w-6" strokeWidth={1.5} />}
          title={t('common.empty_title')}
          description={t('common.empty_hint')}
        />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t('menu_items_report.col_name')}</th>
                <th className="px-4 py-2.5 font-medium">{t('menu_items_report.col_category')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('menu_items_report.col_quantity')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('menu_items_report.col_revenue')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('menu_items_report.col_cost')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('menu_items_report.col_profit')}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t('menu_items_report.col_orders')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {rows.map((r) => {
                const positive = r.gross_profit_minor >= 0;
                return (
                  <tr key={r.menu_item_id ?? r.name} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                    <td className="px-4 py-2.5 font-medium text-[#16221f] dark:text-white">{r.name || '—'}</td>
                    <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                      {r.category_name || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                      {formatNumber(r.quantity_sold)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                      {formatUZS(r.revenue_minor)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatUZS(r.cost_minor)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                    >
                      {formatUZS(r.gross_profit_minor)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatNumber(r.orders_count)}
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
