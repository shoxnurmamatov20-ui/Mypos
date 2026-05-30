'use client';

import {
  type Ingredient,
  type StockMovement,
  inventoryApi,
} from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, PackageMinus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { TableSkeleton, inputClass } from '../_components/ui-helpers';
import { daysAgo, formatDateTime, today } from '../_components/format';

type EnrichedMovement = StockMovement & {
  ingredient?: {
    id: string;
    name: { uz: string; ru: string; en: string };
    unit: string;
    cost_per_unit: number;
    sku: string | null;
  };
};

export function ConsumptionView() {
  const t = useTranslations('inventory');

  const [reason, setReason] = useState<string>('order_consume');
  const [ingredientId, setIngredientId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
  const [dateTo, setDateTo] = useState<string>(today());
  const [page, setPage] = useState(1);
  const perPage = 30;

  const statsQuery = useQuery({
    queryKey: ['inventory', 'movements', 'stats', reason, ingredientId],
    queryFn: () =>
      inventoryApi.movements.stats(apiClient, {
        reason: reason || undefined,
        ingredient_id: ingredientId || undefined,
      }),
    refetchInterval: 60_000,
  });

  const ingredientsQuery = useQuery({
    queryKey: ['inventory', 'ingredients', 'consumption-filter'],
    queryFn: () =>
      inventoryApi.ingredients.list(apiClient, { active_only: true, per_page: 500 }),
    staleTime: 5 * 60_000,
  });
  const ingredients: Ingredient[] = ingredientsQuery.data?.data ?? [];

  const listQuery = useQuery({
    queryKey: ['inventory', 'movements', 'list', reason, ingredientId, dateFrom, dateTo, page],
    queryFn: () =>
      inventoryApi.movements.listAll(apiClient, {
        reason: reason || undefined,
        ingredient_id: ingredientId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: '-recorded_at',
        page,
        per_page: perPage,
      }),
    refetchInterval: 60_000,
  });

  const movements = (listQuery.data?.data ?? []) as EnrichedMovement[];
  const meta = listQuery.data?.meta;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const stats = statsQuery.data?.data;

  return (
    <div className="space-y-5">
      {/* Title */}
      <h1 className="text-[20px] font-semibold tracking-tight text-[#16221f] dark:text-white">
        {t('consumption.title')}
      </h1>

      {/* Stats — 3 simple cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SimpleStat
          label={t('consumption.stats.today')}
          value={stats ? formatNumber(stats.today.quantity) : '0'}
        />
        <SimpleStat
          label={t('consumption.stats.this_week')}
          value={stats ? formatNumber(stats.week.quantity) : '0'}
        />
        <SimpleStat
          label={t('consumption.stats.cost_value')}
          value={formatUZS(stats?.month.cost ?? 0)}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('fields.reason')}>
          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setPage(1); }}
            className={inputClass}
          >
            <option value="">{t('consumption.reason_all')}</option>
            <option value="order_consume">{t('consumption.reason_order_consume')}</option>
            <option value="adjust">{t('consumption.reason_adjust')}</option>
            <option value="waste">{t('consumption.reason_waste')}</option>
            <option value="transfer">{t('consumption.reason_transfer')}</option>
          </select>
        </Field>

        <Field label={t('fields.ingredient')}>
          <select
            value={ingredientId}
            onChange={(e) => { setIngredientId(e.target.value); setPage(1); }}
            className={inputClass}
          >
            <option value="">{t('consumption.reason_all')}</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name.uz}</option>
            ))}
          </select>
        </Field>

        <Field label={t('consumption.from_date')}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className={inputClass}
          />
        </Field>

        <Field label={t('consumption.to_date')}>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Table */}
      {listQuery.isLoading ? (
        <TableSkeleton rows={8} />
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white py-12 text-center dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <PackageMinus className="h-6 w-6 text-[#94a3b8]" strokeWidth={1.5} />
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('consumption.empty_title')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t('fields.doc_date')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('fields.ingredient')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('fields.reason')}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t('fields.quantity')}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t('fields.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                {movements.map((m) => {
                  const qty = Math.abs(m.delta);
                  const cost = m.cost_per_unit ?? m.ingredient?.cost_per_unit ?? 0;
                  const value = qty * cost;
                  return (
                    <tr key={m.id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                      <td className="whitespace-nowrap px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                        {formatDateTime(m.recorded_at ?? m.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-[#16221f] dark:text-white">
                        {m.ingredient?.name?.uz ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                        {m.reason_label ?? m.reason}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                        −{formatNumber(qty)} {m.ingredient?.unit ?? ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                        {formatUZS(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {lastPage > 1 ? (
            <div className="flex items-center justify-between border-t border-[rgba(22,34,31,0.06)] px-4 py-2.5 text-xs text-[#62716d] dark:border-[rgba(255,255,255,0.05)] dark:text-[#94a3b8]">
              <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[#62716d] hover:bg-[#eef4f3] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#1a2235] outline-none focus:outline-none"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">{page} / {lastPage}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[#62716d] hover:bg-[#eef4f3] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#1a2235] outline-none focus:outline-none"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-4 py-3 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <p className="text-xs text-[#62716d] dark:text-[#94a3b8]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#16221f] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[#62716d] dark:text-[#94a3b8]">{label}</span>
      {children}
    </label>
  );
}

function formatNumber(n: number): string {
  if (n === 0) return '0';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(n);
}
