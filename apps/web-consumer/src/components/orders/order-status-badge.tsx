'use client';

import type { MockOrderStatus } from '@/lib/save-order';

type Props = {
  status: MockOrderStatus;
  label: string;
};

/**
 * Color-coded pill showing the current order status.
 *
 * Tailwind classes are listed as literals — the JIT scanner only sees what
 * appears verbatim in source, so do NOT derive these via concatenation.
 */
export function OrderStatusBadge({ status, label }: Props) {
  const cls = pillClass(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${cls}`}
    >
      {label}
    </span>
  );
}

function pillClass(status: MockOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'preparing':
      return 'bg-blue-100 text-blue-700';
    case 'ready':
      return 'bg-mint-100 text-mint-700';
    case 'on_the_way':
      return 'bg-purple-100 text-purple-700';
    case 'delivered':
      return 'bg-neutral-100 text-neutral-600';
  }
}
