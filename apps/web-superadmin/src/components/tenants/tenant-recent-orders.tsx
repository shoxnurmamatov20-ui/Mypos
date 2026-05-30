'use client';

import { ArrowRight, Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUZS } from '@/lib/format';
import type { MockOrder } from '@/data/mock-tenant-detail';

type Props = {
  orders: readonly MockOrder[];
  onViewAll: () => void;
};

const STATUS_STYLE: Record<MockOrder['status'], string> = {
  pending:   'bg-amber-50 text-[#b7791f] dark:bg-amber-500/15 dark:text-amber-400',
  preparing: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  served:    'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
  paid:      'bg-emerald-50 text-[#18794e] dark:bg-emerald-500/15 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-[#b42318] dark:bg-red-500/15 dark:text-red-400',
};

export function TenantRecentOrders({ orders, onViewAll }: Props) {
  const t = useTranslations('tenant_detail');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recent_orders_title')}</CardTitle>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f766e] dark:text-[#14b8a6] transition-colors hover:text-[#0b5e57] dark:hover:text-[#2dd4bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          <span>{t('view_all')}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </CardHeader>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] p-6 text-center">
          <Inbox
            className="w-7 h-7 mb-2 text-gray-300 dark:text-gray-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('recent_orders_empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#62716d] dark:text-[#94a3b8]">
                <th scope="col" className="pb-2 px-2 font-semibold">{t('th_order_no')}</th>
                <th scope="col" className="pb-2 px-2 font-semibold">{t('th_order_status')}</th>
                <th scope="col" className="pb-2 px-2 text-right font-semibold">
                  {t('th_order_total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
              {orders.map((order) => (
                <tr key={order.id} className="text-[#16221f] dark:text-gray-200">
                  <td className="py-2.5 px-2 font-mono">{order.order_no}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold tabular-nums">
                    {formatUZS(order.total_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
