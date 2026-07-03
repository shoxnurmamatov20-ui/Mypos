'use client';

import { type Order, type OrderStatus, type OrderType, ordersApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { OrderCard } from './order-card';
import { OrderDetailDialog } from './order-detail-dialog';
import { OrdersFiltersToolbar } from './orders-filters-toolbar';

const REFRESH_INTERVAL_MS = 15_000;

type Filters = {
  statusFilter: Set<OrderStatus>;
  typeFilter: Set<OrderType>;
  dateFrom: string;
  dateTo: string;
};

function applyFilters(orders: Order[], f: Filters): Order[] {
  return orders.filter((o) => {
    if (f.statusFilter.size > 0 && !f.statusFilter.has(o.status)) return false;
    if (f.typeFilter.size > 0 && !f.typeFilter.has(o.type)) return false;
    if (f.dateFrom || f.dateTo) {
      const placed = o.placed_at ?? o.created_at;
      const when = new Date(placed).getTime();
      if (f.dateFrom && when < new Date(f.dateFrom).getTime()) return false;
      if (f.dateTo) {
        const end = new Date(f.dateTo);
        end.setHours(23, 59, 59, 999);
        if (when > end.getTime()) return false;
      }
    }
    return true;
  });
}

function toggleInSet<T>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function OrdersManager() {
  const t = useTranslations('orders');
  const [statusFilter, setStatusFilter] = useState<Set<OrderStatus>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<OrderType>>(new Set());
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'list'],
    queryFn: () => ordersApi.list(apiClient, { per_page: 100 }),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const orders: Order[] = ordersQuery.data?.data ?? [];

  const filtered = useMemo(
    () => applyFilters(orders, { statusFilter, typeFilter, dateFrom, dateTo }),
    [orders, statusFilter, typeFilter, dateFrom, dateTo],
  );

  const selectedOrder = selectedId ? (orders.find((o) => o.id === selectedId) ?? null) : null;

  const clearFilters = (): void => {
    setStatusFilter(new Set());
    setTypeFilter(new Set());
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="flex flex-col gap-6">
      <OrdersFiltersToolbar
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onToggleStatus={(s) => setStatusFilter((prev) => toggleInSet(prev, s))}
        onToggleType={(ty) => setTypeFilter((prev) => toggleInSet(prev, ty))}
        onDateFrom={setDateFrom}
        onDateTo={setDateTo}
        onClear={clearFilters}
        totalCount={orders.length}
        filteredCount={filtered.length}
      />

      {ordersQuery.isLoading && (
        <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-6 text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:text-[#94a3b8]">
          {t('loading')}
        </div>
      )}

      {ordersQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t('load_failed')}
        </div>
      )}

      {!ordersQuery.isLoading && !ordersQuery.isError && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] p-12 text-center text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.10)] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedId(order.id)}
              onChanged={() => {
                void ordersQuery.refetch();
              }}
            />
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            void ordersQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
