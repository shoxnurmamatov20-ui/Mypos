'use client';

import type { Order, OrderStatus } from '@mypos/api-client';
import { Clock, Utensils } from 'lucide-react';
import { formatTimeAgo, minutesSince, urgencyLevel } from '@/lib/time';

type ColumnStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;

type OrderCardProps = {
  order: Order;
  column: ColumnStatus;
  nowTick: number;
  isUpdating: boolean;
  onAdvance: (order: Order) => void;
};

const ACTION_LABEL: Record<ColumnStatus, string> = {
  pending: 'Tayyorlashni boshlash',
  preparing: 'Tayyor',
  ready: 'Berildi',
};

const ACTION_CLASS: Record<ColumnStatus, string> = {
  pending: 'bg-brand-500 hover:bg-brand-600',
  preparing: 'bg-mint-600 hover:bg-mint-700',
  ready: 'bg-neutral-500 hover:bg-neutral-400',
};

const URGENCY_BORDER = {
  normal: 'border-neutral-700',
  warning: 'border-warning',
  urgent: 'border-danger',
} as const;

const URGENCY_BADGE = {
  normal: 'bg-neutral-700 text-neutral-200',
  warning: 'bg-warning/20 text-warning',
  urgent: 'bg-danger/20 text-danger',
} as const;

export function OrderCard({
  order,
  column,
  nowTick,
  isUpdating,
  onAdvance,
}: OrderCardProps) {
  // `nowTick` forces re-evaluation on each tick without storing state here.
  void nowTick;

  const placedAt = order.placed_at ?? order.created_at;
  const minutes = minutesSince(placedAt);
  const urgency = urgencyLevel(minutes);

  const tableLabel = order.table?.name ?? null;

  return (
    <article
      className={`rounded-2xl border-2 bg-neutral-800 p-5 shadow-lg ${URGENCY_BORDER[urgency]}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-5xl font-bold text-neutral-50">
            #{order.order_no}
          </div>
          {tableLabel !== null ? (
            <div className="mt-1 flex items-center gap-2 text-lg text-neutral-300">
              <Utensils className="h-4 w-4" />
              <span>{tableLabel}</span>
            </div>
          ) : (
            <div className="mt-1 text-lg text-neutral-400">
              {order.type === 'takeaway' ? 'Olib ketish' : '—'}
            </div>
          )}
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${URGENCY_BADGE[urgency]}`}
        >
          <Clock className="h-4 w-4" />
          <span>{formatTimeAgo(minutes)}</span>
        </div>
      </header>

      <ul className="mb-5 space-y-2">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-neutral-700 pb-2 last:border-b-0 last:pb-0"
          >
            <span className="text-2xl font-medium text-neutral-100">
              {item.name}
            </span>
            <span className="shrink-0 rounded-md bg-neutral-700 px-2.5 py-1 text-2xl font-bold text-brand-300">
              x{item.quantity}
            </span>
          </li>
        ))}
      </ul>

      {order.notes !== null && order.notes.trim().length > 0 && (
        <p className="mb-4 rounded-lg bg-neutral-900/60 px-3 py-2 text-base italic text-neutral-300">
          {order.notes}
        </p>
      )}

      <button
        type="button"
        onClick={() => onAdvance(order)}
        disabled={isUpdating}
        className={`w-full rounded-xl px-4 py-4 text-xl font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60 ${ACTION_CLASS[column]}`}
      >
        {isUpdating ? 'Yangilanmoqda...' : ACTION_LABEL[column]}
      </button>
    </article>
  );
}
