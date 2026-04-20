'use client';

import type { OrderItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';

export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  const t = useTranslations('orders');

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">{t('empty_items')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <th className="px-3 py-2">{t('detail.item_name')}</th>
            <th className="px-3 py-2 text-right">{t('detail.qty')}</th>
            <th className="px-3 py-2 text-right">{t('detail.price')}</th>
            <th className="px-3 py-2 text-right">{t('detail.subtotal')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2">
                <div className="font-medium text-neutral-900">{item.name}</div>
                {item.modifiers.length > 0 && (
                  <div className="text-xs text-neutral-500">
                    {item.modifiers.map((m) => m.name).join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs italic text-neutral-500">{item.notes}</div>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatUZS(item.price_amount)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatUZS(item.subtotal_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
