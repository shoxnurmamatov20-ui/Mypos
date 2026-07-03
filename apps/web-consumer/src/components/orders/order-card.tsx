'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import type { MockOrder, MockOrderStatus } from '@/lib/save-order';

type Props = {
  order: MockOrder;
  status: MockOrderStatus;
  href: Route;
  /** Pre-localized labels passed in by the page. */
  labels: {
    status: string;
    itemsCount: string;
    totalText: string;
    dateText: string;
  };
};

const MAX_PREVIEW_ITEMS = 3;

export function OrderCard({ order, status, href, labels }: Props) {
  const preview = order.items.slice(0, MAX_PREVIEW_ITEMS);
  const extra = order.items.length - preview.length;

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand-500/20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-sm font-bold text-neutral-900">#{order.orderNo}</span>
          <span className="mt-0.5 text-xs text-neutral-500">{labels.dateText}</span>
        </div>
        <OrderStatusBadge status={status} label={labels.status} />
      </div>

      <p className="mt-3 flex items-center gap-2 text-base font-semibold text-neutral-900">
        <span aria-hidden="true">🍴</span>
        <span className="truncate">{order.restaurantName ?? '—'}</span>
      </p>

      <p className="mt-2 truncate text-sm text-neutral-500">
        {preview.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
        {extra > 0 ? ` +${extra}` : ''}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-sm text-neutral-500">{labels.itemsCount}</span>
        <span className="text-base font-bold text-neutral-900">{labels.totalText}</span>
      </div>
    </Link>
  );
}

/** Re-exported helper so the orders list page can compute `itemsCount` once. */
export function totalItemsInOrder(order: MockOrder): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}
