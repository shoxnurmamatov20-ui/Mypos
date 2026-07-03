'use client';

import { Banknote, CreditCard, Receipt, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { usePayments } from '@/hooks/use-cashier-data';
import type { PaymentMethod, PaymentStatus } from '@/lib/api';
import { formatMoney, formatTime } from '@/lib/format';

const METHOD_VARIANT: Record<PaymentMethod, BadgeVariant> = {
  cash: 'success',
  card: 'info',
  click: 'default',
  payme: 'default',
  uzum: 'default',
  other: 'neutral',
};

const STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
};

/** Payments collected during the shift — summary stat cards + a flat list. */
export function PaymentsView() {
  const t = useTranslations('payments');
  const { data, isLoading } = usePayments();
  const rows = data?.rows ?? [];

  const summary = useMemo(() => {
    const paid = rows.filter((p) => p.status === 'paid');
    const sum = (list: typeof paid) => list.reduce((n, p) => n + p.amount, 0);
    return {
      total: sum(paid),
      count: paid.length,
      cash: sum(paid.filter((p) => p.method === 'cash')),
      card: sum(paid.filter((p) => p.method === 'card')),
    };
  }, [rows]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#16221f] dark:text-white">{t('title')}</h1>
        <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">{t('subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label={t('total_collected')}
          value={formatMoney(summary.total)}
          highlight
        />
        <StatCard
          icon={<Receipt className="h-4 w-4" />}
          label={t('count')}
          value={String(summary.count)}
        />
        <StatCard
          icon={<Banknote className="h-4 w-4" />}
          label={t('cash_total')}
          value={formatMoney(summary.cash)}
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4" />}
          label={t('card_total')}
          value={formatMoney(summary.card)}
        />
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 border-b border-[rgba(22,34,31,0.07)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#62716d] sm:grid dark:border-[rgba(255,255,255,0.06)] dark:text-[#94a3b8]">
          <span>{t('order')}</span>
          <span>{t('method')}</span>
          <span>{t('status_label')}</span>
          <span className="text-right">{t('amount')}</span>
          <span className="text-right">{t('time')}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                key={i}
                className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('empty')}
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
            {rows.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-2 items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <span className="text-[13px] font-semibold text-[#16221f] dark:text-white">
                  {p.order_no}
                </span>
                <span>
                  <Badge variant={METHOD_VARIANT[p.method]}>{t(`methods.${p.method}`)}</Badge>
                </span>
                <span className="hidden sm:block">
                  <Badge variant={STATUS_VARIANT[p.status]}>{t(`statuses.${p.status}`)}</Badge>
                </span>
                <span className="tnum text-right text-[13px] font-bold text-[#16221f] dark:text-white">
                  {formatMoney(p.amount)}
                </span>
                <span className="tnum hidden text-right text-[12px] text-[#62716d] sm:block dark:text-[#94a3b8]">
                  {formatTime(p.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#62716d] dark:text-[#94a3b8]">
        <span className="text-[#0f766e] dark:text-[#5ed6c9]">{icon}</span>
        {label}
      </div>
      <p
        className={
          highlight
            ? 'tnum mt-1.5 text-lg font-bold text-[#0f766e] dark:text-[#5ed6c9]'
            : 'tnum mt-1.5 text-lg font-bold text-[#16221f] dark:text-white'
        }
      >
        {value}
      </p>
    </div>
  );
}
