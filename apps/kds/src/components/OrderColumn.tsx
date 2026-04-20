'use client';

import type { Order, OrderStatus } from '@mypos/api-client';
import { OrderCard } from './OrderCard';

type ColumnStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;

type OrderColumnProps = {
  title: string;
  status: ColumnStatus;
  orders: Order[];
  nowTick: number;
  updatingId: string | null;
  onAdvance: (order: Order) => void;
};

const HEADER_TONE: Record<ColumnStatus, string> = {
  pending: 'border-brand-500/40 bg-brand-500/10 text-brand-300',
  preparing: 'border-warning/40 bg-warning/10 text-warning',
  ready: 'border-mint-500/40 bg-mint-500/10 text-mint-300',
};

export function OrderColumn({
  title,
  status,
  orders,
  nowTick,
  updatingId,
  onAdvance,
}: OrderColumnProps) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <header
        className={`mb-4 flex shrink-0 items-center justify-between rounded-xl border-2 px-5 py-3 ${HEADER_TONE[status]}`}
      >
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <span className="rounded-full bg-neutral-900/60 px-3 py-1 text-lg font-bold tabular-nums">
          {orders.length}
        </span>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {orders.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-700 text-center text-lg text-neutral-500">
            Buyurtmalar yo&lsquo;q
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              column={status}
              nowTick={nowTick}
              isUpdating={updatingId === order.id}
              onAdvance={onAdvance}
            />
          ))
        )}
      </div>
    </section>
  );
}
