'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useOrders } from '@/hooks/use-cashier-data';
import { api, type OrderStatus, type OrderSummary } from '@/lib/api';
import { cn } from '@/lib/cn';
import { OrderCard } from './order-card';

type FilterId = 'all' | 'active' | 'pending' | 'preparing' | 'ready' | 'completed';

const FILTERS: FilterId[] = ['all', 'active', 'pending', 'preparing', 'ready', 'completed'];
const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready', 'served'];

function matchesFilter(order: OrderSummary, filter: FilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ACTIVE_STATUSES.includes(order.status);
  return order.status === filter;
}

/** Active + completed orders, with one-tap status advancement. */
export function OrdersView() {
  const t = useTranslations('orders');
  const queryClient = useQueryClient();
  const { data, isLoading } = useOrders();
  const [filter, setFilter] = useState<FilterId>('active');

  const advance = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) =>
      api.updateOrderStatus(id, next),
    // Optimistic — the register feels instant even before the API answers,
    // and keeps working against the offline fixtures.
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previous = queryClient.getQueriesData({ queryKey: ['orders'] });
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (old: { rows: OrderSummary[]; live: boolean } | undefined) =>
          old
            ? {
                ...old,
                rows: old.rows.map((o) => (o.id === id ? { ...o, status: next } : o)),
              }
            : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Backend unreachable — keep the optimistic state (offline fixtures).
      void context;
    },
  });

  const rows = data?.rows ?? [];
  const visible = rows.filter((order) => matchesFilter(order, filter));

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#16221f] dark:text-white">{t('title')}</h1>
        <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">{t('subtitle')}</p>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              filter === id
                ? 'bg-[#0f766e] text-white'
                : 'bg-[#eef4f3] text-[#62716d] hover:text-[#16221f] dark:bg-[#1a2235] dark:text-[#94a3b8] dark:hover:text-white',
            )}
          >
            {t(`filter_${id}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              key={i}
              className="h-[168px] animate-pulse rounded-xl border border-[rgba(22,34,31,0.06)] bg-gray-100 dark:border-[rgba(255,255,255,0.05)] dark:bg-gray-800/60"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.14)] py-16 text-center text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.1)] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              pending={advance.isPending && advance.variables?.id === order.id}
              onAdvance={(id, next) => advance.mutate({ id, next })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
