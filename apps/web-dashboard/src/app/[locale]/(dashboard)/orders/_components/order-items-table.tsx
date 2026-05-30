'use client';

import type { OrderItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';

export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  const t = useTranslations('orders');

  if (items.length === 0) {
    return <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('empty_items')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
      <table className="min-w-full divide-y divide-[rgba(22,34,31,0.06)] text-sm dark:divide-[rgba(255,255,255,0.05)]">
        <thead className="bg-[#eef4f3] dark:bg-[#1a2235]">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-[#62716d] dark:text-[#94a3b8]">
            <th className="px-3 py-2">{t('detail.item_name')}</th>
            <th className="px-3 py-2 text-right">{t('detail.qty')}</th>
            <th className="px-3 py-2 text-right">{t('detail.price')}</th>
            <th className="px-3 py-2 text-right">{t('detail.subtotal')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(22,34,31,0.06)] bg-white dark:divide-[rgba(255,255,255,0.05)] dark:bg-[#111827]">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2">
                <div className="font-medium text-[#16221f] dark:text-white">{item.name}</div>
                {item.modifiers.length > 0 && (
                  <div className="text-xs text-[#62716d] dark:text-[#94a3b8]">
                    {item.modifiers.map((m) => m.name).join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs italic text-[#62716d] dark:text-[#94a3b8]">{item.notes}</div>
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
