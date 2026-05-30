'use client';

import type { Order, OrderStatus } from '@mypos/api-client';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CardDensity } from '@/lib/settings';
import { OrderCard } from './order-card';

type ColumnStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;

type OrderColumnProps = {
  title: string;
  status: ColumnStatus;
  orders: Order[];
  nowTick: number;
  updatingId: string | null;
  onAdvance: (order: Order) => void;
  warningMin: number;
  urgentMin: number;
  density: CardDensity;
};

/** Status-toned dot + header tint per column. */
const HEADER_TONE: Record<ColumnStatus, { dot: string; count: string }> = {
  pending: {
    dot: 'bg-[#0f766e]',
    count:
      'bg-[rgba(15,118,110,0.10)] text-[#0f766e] dark:bg-[rgba(20,184,166,0.15)] dark:text-[#14b8a6]',
  },
  preparing: {
    dot: 'bg-[#b7791f]',
    count:
      'bg-[rgba(183,121,31,0.12)] text-[#b7791f] dark:bg-[rgba(217,154,58,0.16)] dark:text-[#d99a3a]',
  },
  ready: {
    dot: 'bg-[#18794e]',
    count:
      'bg-[rgba(24,121,78,0.12)] text-[#18794e] dark:bg-[rgba(34,197,94,0.16)] dark:text-[#4ade80]',
  },
};

/**
 * A board column — sticky status header with a live count, then a
 * scrollable stack of tickets. The list scrolls independently so the
 * three columns stay aligned even during a 999-cover rush.
 */
export function OrderColumn({
  title,
  status,
  orders,
  nowTick,
  updatingId,
  onAdvance,
  warningMin,
  urgentMin,
  density,
}: OrderColumnProps) {
  const tone = HEADER_TONE[status];

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-gray-50/60 dark:bg-[#0e1626]">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('h-2 w-2 rounded-full shrink-0', tone.dot)} />
          <h2 className="text-[14px] font-bold text-[#16221f] dark:text-white truncate">{title}</h2>
        </div>
        <span
          className={cn(
            'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[12px] font-bold tabular-nums',
            tone.count,
          )}
        >
          {orders.length}
        </span>
      </header>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] text-[#62716d] dark:text-[#94a3b8]">
            <Inbox className="h-7 w-7 opacity-50" strokeWidth={1.5} />
            <p className="text-[12px]">Buyurtmalar yo&apos;q</p>
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
              warningMin={warningMin}
              urgentMin={urgentMin}
              density={density}
            />
          ))
        )}
      </div>
    </section>
  );
}
