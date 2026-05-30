'use client';

import type { Order, OrderStatus, OrderType } from '@mypos/api-client';
import { Clock, StickyNote, Utensils } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CardDensity } from '@/lib/settings';
import { formatTimeAgo, minutesSince, urgencyLevel } from '@/lib/time';

type ColumnStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;

type OrderCardProps = {
  order: Order;
  column: ColumnStatus;
  /** Bumped by the board every 30s so elapsed-time labels stay fresh. */
  nowTick: number;
  isUpdating: boolean;
  onAdvance: (order: Order) => void;
  warningMin: number;
  urgentMin: number;
  density: CardDensity;
};

const ACTION_LABEL: Record<ColumnStatus, string> = {
  pending: 'Tayyorlashni boshlash',
  preparing: 'Tayyor',
  ready: 'Berildi',
};

const ACTION_CLASS: Record<ColumnStatus, string> = {
  pending: 'bg-[#0f766e] hover:bg-[#0d6359] text-white',
  preparing: 'bg-[#18794e] hover:bg-[#136340] text-white',
  ready:
    'bg-[#16221f] hover:bg-[#2a3a34] text-white dark:bg-white dark:hover:bg-[#e2e8f0] dark:text-[#16221f]',
};

const URGENCY_BORDER = {
  normal: 'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
  warning: 'border-[#b7791f]/55 dark:border-[#d99a3a]/55',
  urgent: 'border-[#b42318] dark:border-[#f87171] animate-[urgentPulse_1.6s_ease-in-out_infinite]',
} as const;

const URGENCY_CHIP = {
  normal: 'bg-[#eef4f3] text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]',
  warning:
    'bg-[rgba(183,121,31,0.12)] text-[#b7791f] dark:bg-[rgba(217,154,58,0.16)] dark:text-[#d99a3a]',
  urgent:
    'bg-[rgba(180,35,24,0.12)] text-[#b42318] dark:bg-[rgba(248,113,113,0.16)] dark:text-[#f87171]',
} as const;

const TYPE_LABEL: Record<OrderType, string> = {
  dine_in: 'Zalda',
  takeaway: 'Olib ketish',
  delivery: 'Yetkazib berish',
  kiosk: 'Kiosk',
  qr_menu: 'QR menyu',
  telegram: 'Telegram',
  marketplace: 'Marketplace',
};

export function OrderCard({
  order,
  column,
  nowTick,
  isUpdating,
  onAdvance,
  warningMin,
  urgentMin,
  density,
}: OrderCardProps) {
  // `nowTick` forces re-evaluation on each tick without storing state here.
  void nowTick;

  const placedAt = order.placed_at ?? order.created_at;
  const minutes = minutesSince(placedAt);
  const urgency = urgencyLevel(minutes, warningMin, urgentMin);
  const compact = density === 'compact';

  const tableLabel = order.table?.name ?? null;
  const originLabel = tableLabel ?? TYPE_LABEL[order.type];

  return (
    <article
      className={cn(
        'rounded-xl border-2 bg-white dark:bg-[#111827] transition-colors',
        '[animation:orderIn_0.28s_cubic-bezier(0,0,0.2,1)]',
        compact ? 'p-3.5' : 'p-4',
        URGENCY_BORDER[urgency],
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              'font-display font-black leading-none tabular-nums text-[#16221f] dark:text-white',
              compact ? 'text-[26px]' : 'text-[32px]',
            )}
          >
            #{order.order_no}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8]">
            <Utensils className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="truncate">{originLabel}</span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums whitespace-nowrap',
            URGENCY_CHIP[urgency],
          )}
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
          {formatTimeAgo(minutes)}
        </span>
      </header>

      <ul
        className={cn(
          'mt-3 border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-3 space-y-1.5',
        )}
      >
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <span
              className={cn(
                'font-semibold text-[#16221f] dark:text-white leading-snug',
                compact ? 'text-[14px]' : 'text-[15px]',
              )}
            >
              {item.name}
              {item.notes && item.notes.trim().length > 0 ? (
                <span className="block text-[11px] font-normal italic text-[#62716d] dark:text-[#94a3b8]">
                  {item.notes}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 rounded-md bg-[#eef4f3] dark:bg-[#1a2235] px-2 py-0.5 text-[14px] font-extrabold tabular-nums text-[#0f766e] dark:text-[#14b8a6]">
              ×{item.quantity}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && order.notes.trim().length > 0 ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-[rgba(183,121,31,0.08)] dark:bg-[rgba(217,154,58,0.10)] px-2.5 py-2 text-[12px] italic text-[#b7791f] dark:text-[#d99a3a]">
          <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{order.notes}</span>
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => onAdvance(order)}
        disabled={isUpdating}
        className={cn(
          'mt-3.5 w-full rounded-lg px-4 text-[14px] font-semibold transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(15,118,110,0.30)] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111827]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          compact ? 'py-2.5' : 'py-3',
          ACTION_CLASS[column],
        )}
      >
        {isUpdating ? 'Yangilanmoqda…' : ACTION_LABEL[column]}
      </button>
    </article>
  );
}
