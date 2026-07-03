'use client';

import { type Ingredient, inventoryApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, PackageX, PiggyBank, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DashStatCard } from '../../_components/stat-card';
import { formatNumber } from '../_components/format';
import {
  EmptyState,
  ErrorBanner,
  inputClass,
  StatStripSkeleton,
  TableSkeleton,
} from '../_components/ui-helpers';
import { WarehouseSelect } from '../_components/warehouse-select';

export function StockBalanceView() {
  const t = useTranslations('inventory');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [search, setSearch] = useState('');

  // Backend currently aggregates stock per ingredient (not per-warehouse) but
  // we pre-wire the filter so when per-warehouse stock lands the page is
  // already plumbed through. Sent as a query parameter only if non-empty.
  const query = useQuery({
    queryKey: ['inventory', 'ingredients', 'stock', warehouseId, search],
    queryFn: () =>
      inventoryApi.ingredients.list(apiClient, {
        q: search.trim() || undefined,
        per_page: 200,
      }),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const ingredients: Ingredient[] = query.data?.data ?? [];

  const stats = useMemo(() => {
    const total = ingredients.length;
    let low = 0;
    let out = 0;
    let value = 0;
    for (const ing of ingredients) {
      const stock = ing.current_stock;
      const minStock = ing.min_stock ?? 0;
      if (stock <= 0) out += 1;
      else if (minStock > 0 && stock <= minStock) low += 1;
      value += stock * ing.cost_per_unit;
    }
    return { total, low, out, value };
  }, [ingredients]);

  return (
    <>
      {/* Stats strip */}
      {query.isLoading ? (
        <StatStripSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <DashStatCard
            label={t('stock_balance.stats.skus')}
            value={String(stats.total)}
            icon={Package}
            accent="teal"
            fillPct={100}
          />
          <DashStatCard
            label={t('stock_balance.stats.low_stock')}
            value={String(stats.low)}
            icon={AlertTriangle}
            accent="amber"
            fillPct={stats.total > 0 ? (stats.low / stats.total) * 100 : 0}
          />
          <DashStatCard
            label={t('stock_balance.stats.out_of_stock')}
            value={String(stats.out)}
            icon={PackageX}
            accent="red"
            fillPct={stats.total > 0 ? (stats.out / stats.total) * 100 : 0}
          />
          <DashStatCard
            label={t('stock_balance.stats.total_value')}
            value={formatUZS(stats.value)}
            icon={PiggyBank}
            accent="green"
            fillPct={100}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62716d] dark:text-[#94a3b8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('stock_view.search')}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="w-full sm:w-64">
          <WarehouseSelect value={warehouseId} onChange={setWarehouseId} includeAll />
        </div>
      </div>

      {/* Table */}
      {query.isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : ingredients.length === 0 ? (
        <EmptyState icon={Package} title={t('empty.stock')} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-3 text-left">{t('cols.name')}</th>
                <th className="px-4 py-3 text-left">{t('cols.unit')}</th>
                <th className="px-4 py-3 text-right">{t('cols.current')}</th>
                <th className="px-4 py-3 text-right">{t('cols.min')}</th>
                <th className="px-4 py-3 text-right">{t('cols.cost')}</th>
                <th className="px-4 py-3 text-right">{t('stock_balance.stats.total_value')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {ingredients.map((ing) => {
                const stock = ing.current_stock;
                const minStock = ing.min_stock ?? 0;
                const isOut = stock <= 0;
                const isLow = !isOut && minStock > 0 && stock <= minStock;
                const totalValue = stock * ing.cost_per_unit;
                return (
                  <tr key={ing.id} className="hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#16221f] dark:text-white">
                        {ing.name.uz}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                        {ing.sku ? <span>{ing.sku}</span> : null}
                        {ing.category ? (
                          <span className="rounded-full bg-[#eef4f3] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#16221f] dark:bg-[#0d1424] dark:text-[#e2e8f0]">
                            {ing.category.name.uz}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#eef4f3] px-2 py-0.5 text-xs text-[#16221f] dark:bg-[#0d1424] dark:text-[#e2e8f0]">
                        {ing.unit}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        isOut
                          ? 'text-rose-600 dark:text-rose-400'
                          : isLow
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#16221f] dark:text-white'
                      }`}
                    >
                      {formatNumber(stock)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {ing.min_stock !== null ? formatNumber(ing.min_stock) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatUZS(ing.cost_per_unit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                      {formatUZS(totalValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
