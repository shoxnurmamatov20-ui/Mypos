'use client';

import { cn, PageHeader } from '@mypos/ui';
import { Receipt, Users } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useMarkServed, useWaiterOrders } from '@/lib/use-waiter-data';
import { formatSom, type OrderStatus, type WaiterOrder } from '@/lib/waiter-data';
import { type PillTone, StatusPill } from './status-pill';
import { DemoBadge, Skeleton } from './waiter-bits';

const STATUS_TONE: Record<OrderStatus, PillTone> = {
  open: 'blue',
  sent: 'teal',
  ready: 'amber',
  served: 'green',
  paid: 'slate',
};

const STATUS_ORDER: readonly OrderStatus[] = ['open', 'sent', 'ready', 'served', 'paid'];

/** "Ready" orders float to the top — food must not go cold. */
const SORT_RANK: Record<OrderStatus, number> = { ready: 0, sent: 1, open: 2, served: 3, paid: 4 };

type Filter = 'all' | OrderStatus;

/** Buyurtmalar — the waiter's own active orders, filterable by status. */
export function OrdersView() {
  const t = useTranslations('waiter');
  const { orders, live, isLoading } = useWaiterOrders();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    const rows = filter === 'all' ? orders : orders.filter((order) => order.status === filter);
    return [...rows].sort((a, b) => SORT_RANK[a.status] - SORT_RANK[b.status]);
  }, [orders, filter]);

  const activeCount = useMemo(
    () => orders.filter((order) => order.status !== 'paid').length,
    [orders],
  );

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title={t('orders.title')}
        description={t('orders.subtitle', { count: activeCount })}
        actions={<DemoBadge show={!live} />}
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...STATUS_ORDER] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'rounded-pill px-3 py-1.5 text-nav-link font-semibold transition-colors active:scale-95',
              filter === value
                ? 'bg-tenant text-tenant-on-primary'
                : 'border border-hairline-soft bg-canvas text-ink-muted-80 hover:text-ink',
            )}
          >
            {value === 'all' ? t('orders.filterAll') : t(`orders.status.${value}`)}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3">
          {['a', 'b', 'c'].map((key) => (
            <Skeleton key={key} className="h-[150px]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline bg-canvas/60 px-6 py-14 text-center text-caption text-ink-muted-80">
          {t('orders.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <OrderCard key={order.apiId ?? order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: WaiterOrder }) {
  const t = useTranslations('waiter');
  const markServed = useMarkServed();

  return (
    <div
      className={cn(
        'rounded-lg border bg-canvas p-4',
        order.status === 'ready' ? 'border-tenant' : 'border-hairline-soft',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-tenant-tint text-tenant">
            <Receipt className="h-[18px] w-[18px]" weight="fill" />
          </span>
          <div>
            <p className="text-caption-strong text-ink tabular-nums">{order.id}</p>
            <p className="text-fine-print text-ink-muted-80">
              {order.table} · {order.openedAt}
            </p>
          </div>
        </div>
        <StatusPill tone={STATUS_TONE[order.status]} label={t(`orders.status.${order.status}`)} />
      </div>

      {order.guests > 0 ? (
        <div className="mt-3 flex items-center gap-1.5 text-fine-print text-ink-muted-80">
          <Users className="h-4 w-4" />
          <span>{t('orders.guests', { count: order.guests })}</span>
        </div>
      ) : null}

      {/* Items */}
      {order.items.length > 0 ? (
        <div className="mt-3 space-y-1 border-t border-hairline-soft pt-3">
          {order.items.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-caption">
              <span className="text-ink">
                <span className="font-semibold tabular-nums">{item.qty}×</span> {item.name}
              </span>
              <span className="tabular-nums text-ink-muted-80">
                {formatSom(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-hairline-soft pt-3">
        <span className="text-fine-print font-semibold uppercase tracking-wide text-ink-muted-80">
          {t('orders.total')}
        </span>
        <span className="text-body-strong text-ink tabular-nums">{formatSom(order.total)}</span>
      </div>

      {/* One-tap next action — only when the kitchen says it's ready */}
      {order.status === 'ready' && order.apiId ? (
        <button
          type="button"
          disabled={markServed.isPending}
          onClick={() => markServed.mutate(order.apiId as string)}
          className="mt-3 w-full rounded-pill bg-tenant py-2.5 text-caption-strong text-tenant-on-primary transition-transform active:scale-95 disabled:opacity-60"
        >
          {t('orders.markServed')}
        </button>
      ) : null}
    </div>
  );
}
