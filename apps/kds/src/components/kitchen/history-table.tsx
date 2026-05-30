'use client';

import type { Order, OrderType } from '@mypos/api-client';
import { Inbox } from 'lucide-react';
import { formatClockTime } from '@/lib/format';

const TYPE_LABEL: Record<OrderType, string> = {
  dine_in: 'Zalda',
  takeaway: 'Olib ketish',
  delivery: 'Yetkazib berish',
  kiosk: 'Kiosk',
  qr_menu: 'QR menyu',
  telegram: 'Telegram',
  marketplace: 'Marketplace',
};

/** Whole minutes between two ISO timestamps, or `null` if either is missing. */
function durationMinutes(fromIso: string | null, toIso: string | null): number | null {
  if (!fromIso || !toIso) return null;
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return Math.round((to - from) / 60_000);
}

type HistoryTableProps = {
  orders: Order[];
};

/**
 * Served-today ledger — the web-superadmin table surface (white card,
 * UPPERCASE column heads, hairline row dividers, hover tint). Read-only:
 * the kitchen reviews what went out, it doesn't re-open a closed ticket.
 */
export function HistoryTable({ orders }: HistoryTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
        <Inbox className="h-8 w-8 opacity-50" strokeWidth={1.5} />
        <p className="text-[13px]">Bugun hali berilgan buyurtma yo&apos;q</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
              {['Buyurtma', 'Manba', 'Taomlar', 'Berilgan', 'Tayyorlash'].map((head, i) => (
                <th
                  key={head}
                  className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] ${
                    i >= 2 ? 'text-right' : 'text-left'
                  }`}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const prep =
                durationMinutes(order.placed_at, order.prepared_at) ??
                durationMinutes(order.placed_at, order.served_at);
              return (
                <tr
                  key={order.id}
                  className="border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)] last:border-0 hover:bg-gray-50/70 dark:hover:bg-[#1a2235]/40 transition-colors"
                >
                  <td className="px-4 py-3 text-[14px] font-bold tabular-nums text-[#16221f] dark:text-white">
                    #{order.order_no}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
                    {order.table?.name ?? TYPE_LABEL[order.type]}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums text-[#16221f] dark:text-white">
                    {itemCount}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {formatClockTime(order.served_at ?? order.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums text-[#16221f] dark:text-white">
                    {prep === null ? '—' : `${prep} daq`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
