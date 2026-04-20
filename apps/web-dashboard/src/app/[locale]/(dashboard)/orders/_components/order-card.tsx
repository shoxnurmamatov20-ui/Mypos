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

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-2xl font-bold text-neutral-900">
            #{order.order_no}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            {t(`orders.filters.type.${order.type}` as 'orders.filters.type.dine_in')}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {isDineIn && order.table && (
        <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700">
          {t('orders.table')}: {order.table.name}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-neutral-600">
        <span>
          {itemsCount} {t('orders.items_count_suffix')}
        </span>
        <span className="font-semibold text-neutral-900">
          {formatUZS(order.amounts.total)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
        <span>{t('orders.elapsed', { minutes: elapsed })}</span>
      </div>

      {action && (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={pending}
          className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {pending
            ? t('orders.updating')
            : t(action.labelKey as 'orders.actions.start_preparing')}
        </button>
      )}
    </button>
  );
}
