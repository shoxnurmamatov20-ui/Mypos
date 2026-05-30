'use client';

import { Clock, Loader2, Users, Utensils } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OrderStatus, OrderSummary } from '@/lib/api';
import { formatMoney, formatTime } from '@/lib/format';

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  draft: 'neutral',
  pending: 'warning',
  preparing: 'info',
  ready: 'success',
  served: 'default',
  completed: 'neutral',
  cancelled: 'danger',
  refunded: 'danger',
};

/** What single transition the cashier can apply next, or null when terminal. */
export function nextAction(
  status: OrderStatus,
): { labelKey: 'mark_ready' | 'mark_served' | 'mark_completed'; next: OrderStatus } | null {
  if (status === 'pending' || status === 'preparing') {
    return { labelKey: 'mark_ready', next: 'ready' };
  }
  if (status === 'ready') return { labelKey: 'mark_served', next: 'served' };
  if (status === 'served') return { labelKey: 'mark_completed', next: 'completed' };
  return null;
}

export function OrderCard({
  order,
  onAdvance,
  pending,
}: {
  order: OrderSummary;
  onAdvance: (id: string, next: OrderStatus) => void;
  pending: boolean;
}) {
  const t = useTranslations('orders');
  const action = nextAction(order.status);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4 transition-colors dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#16221f] dark:text-white">{order.order_no}</p>
          <p className="mt-0.5 text-[12px] text-[#62716d] dark:text-[#94a3b8]">
            {order.table_name ?? t(`status.${order.status}`)}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>{t(`status.${order.status}`)}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[#62716d] dark:text-[#94a3b8]">
        <span className="flex items-center gap-1">
          <Utensils className="h-3.5 w-3.5" />
          {t('items_count', { count: order.items_count })}
        </span>
        {order.guest_count ? (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t('guests', { count: order.guest_count })}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(order.placed_at)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(22,34,31,0.06)] pt-3 dark:border-[rgba(255,255,255,0.06)]">
        <div>
          <p className="tnum text-base font-bold text-[#16221f] dark:text-white">
            {formatMoney(order.total)}
          </p>
          <Badge
            variant={
              order.payment_status === 'paid'
                ? 'success'
                : order.payment_status === 'unpaid'
                  ? 'danger'
                  : 'warning'
            }
            className="mt-1"
          >
            {t(`payment.${order.payment_status}`)}
          </Badge>
        </div>
        {action ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => onAdvance(order.id, action.next)}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {t(action.labelKey)}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
