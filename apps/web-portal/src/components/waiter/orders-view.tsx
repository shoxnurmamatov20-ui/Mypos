'use client';

import { Receipt, Users } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { cn, PageHeader } from '@mypos/ui';
import {
  formatSom,
  getWaiterData,
  type OrderStatus,
  type WaiterOrder,
} from '@/lib/waiter-data';
import { type PillTone, StatusPill } from './status-pill';

const STATUS_TONE: Record<OrderStatus, PillTone> = {
  open: 'blue',
  sent: 'teal',
  ready: 'amber',
  served: 'green',
  paid: 'slate',
};

const STATUS_ORDER: readonly OrderStatus[] = ['open', 'sent', 'ready', 'served', 'paid'];

type Filter = 'all' | OrderStatus;

/** Buyurtmalar — the waiter's own active orders, filterable by status. */
export function OrdersView() {
  const t = useTranslations('waiter');
  const { orders } = useMemo(() => getWaiterData(), []);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  const activeCount = useMemo(
    () => orders.filter((order) => order.status !== 'paid').length,
    [orders],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('orders.title')}
        description={t('orders.subtitle', { count: activeCount })}
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...STATUS_ORDER] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
              filter === value
                ? 'bg-[#0f766e] text-white'
                : 'border border-[rgba(22,34,31,0.10)] bg-white text-[#62716d] hover:text-[#16221f]',
            )}
          >
            {value === 'all' ? t('orders.filterAll') : t(`orders.status.${value}`)}
          </button>
        ))}
      </div>

      {/* Order list */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.14)] bg-white/60 px-6 py-14 text-center text-[13px] text-[#62716d]">
          {t('orders.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: WaiterOrder }) {
  const t = useTranslations('waiter');

  return (
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef4f3] text-[#0f766e]">
            <Receipt className="h-[18px] w-[18px]" weight="fill" />
          </span>
          <div>
            <p className="text-[14px] font-bold text-[#16221f] tabular-nums">{order.id}</p>
            <p className="text-[12px] text-[#62716d]">
              {order.table} · {order.openedAt}
            </p>
          </div>
        </div>
        <StatusPill
          tone={STATUS_TONE[order.status]}
          label={t(`orders.status.${order.status}`)}
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#62716d]">
        <Users className="h-4 w-4" />
        <span>{t('orders.guests', { count: order.guests })}</span>
      </div>

      {/* Items */}
      <div className="mt-3 space-y-1 border-t border-[rgba(22,34,31,0.07)] pt-3">
        {order.items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-[#16221f]">
              <span className="font-semibold tabular-nums">{item.qty}×</span> {item.name}
            </span>
            <span className="tabular-nums text-[#62716d]">
              {formatSom(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-[rgba(22,34,31,0.07)] pt-3">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[#62716d]">
          {t('orders.total')}
        </span>
        <span className="text-[15px] font-black text-[#16221f] tabular-nums">
          {formatSom(order.total)}
        </span>
      </div>
    </div>
  );
}
