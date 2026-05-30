'use client';

import {
  ApiError,
  ordersApi,
  type Order,
  type OrderStatus,
} from '@mypos/api-client';
import { formatUZS, minutesSince } from '@mypos/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { StatusBadge } from './status-badge';

type QuickAction =
  | { next: 'preparing'; labelKey: 'orders.actions.start_preparing' }
  | { next: 'ready'; labelKey: 'orders.actions.mark_ready' }
  | { next: 'served'; labelKey: 'orders.actions.mark_served' }
  | { next: 'completed'; labelKey: 'orders.actions.complete' };

function nextQuickAction(status: OrderStatus): QuickAction | null {
  switch (status) {
    case 'pending':
      return { next: 'preparing', labelKey: 'orders.actions.start_preparing' };
    case 'preparing':
      return { next: 'ready', labelKey: 'orders.actions.mark_ready' };
    case 'ready':
      return { next: 'served', labelKey: 'orders.actions.mark_served' };
    case 'served':
      return { next: 'completed', labelKey: 'orders.actions.complete' };
    default:
      return null;
  }
}

export function OrderCard({
  order,
  onClick,
  onChanged,
}: {
  order: Order;
  onClick: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);

  const action = nextQuickAction(order.status);
  const placedAt = order.placed_at ?? order.created_at;
  const elapsed = minutesSince(new Date(placedAt));
  const itemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
  const isDineIn = order.type === 'dine_in';

  const handleAdvance = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    if (!action) return;
    setPending(true);
    try {
      await ordersApi.updateStatus(apiClient, order.id, { status: action.next });
      toast.success(t('orders.updated'));
      onChanged();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        toast.error(body?.message ?? t('orders.update_failed'));
      } else {
        toast.error(t('orders.update_failed'));
      }
    } finally {
      setPending(false);
    }
  };

  const handleCardKey = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleCardKey}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:hover:border-teal-500 dark:focus:ring-teal-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-2xl font-bold text-[#16221f] dark:text-white">
            #{order.order_no}
          </div>
          <div className="mt-0.5 text-xs text-[#62716d] dark:text-[#94a3b8]">
            {t(`orders.filters.type.${order.type}` as 'orders.filters.type.dine_in')}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {isDineIn && order.table && (
        <div className="rounded-lg bg-[#eef4f3] px-3 py-2 text-sm font-medium text-[#16221f] dark:bg-[#1a2235] dark:text-[#e2e8f0]">
          {t('orders.table')}: {order.table.name}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-[#62716d] dark:text-[#94a3b8]">
        <span>
          {itemsCount} {t('orders.items_count_suffix')}
        </span>
        <span className="font-semibold text-[#16221f] dark:text-white">
          {formatUZS(order.amounts.total)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(22,34,31,0.09)] pt-3 text-xs text-[#62716d] dark:border-[rgba(255,255,255,0.07)] dark:text-[#94a3b8]">
        <span>{t('orders.elapsed', { minutes: elapsed })}</span>
      </div>

      {action && (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={pending}
          className="w-full rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0d5e58] disabled:opacity-60 dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
        >
          {pending
            ? t('orders.updating')
            : t(action.labelKey as 'orders.actions.start_preparing')}
        </button>
      )}
    </div>
  );
}
