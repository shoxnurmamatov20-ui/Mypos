'use client';

import type { OrderStatus, OrderType } from '@mypos/api-client';
import { useTranslations } from 'next-intl';

export const STATUS_FILTERS: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled',
];

export const TYPE_FILTERS: OrderType[] = [
  'dine_in',
  'takeaway',
  'delivery',
  'qr_menu',
  'telegram',
];

export function OrdersFiltersToolbar({
  statusFilter,
  typeFilter,
  dateFrom,
  dateTo,
  onToggleStatus,
  onToggleType,
  onDateFrom,
  onDateTo,
  onClear,
  totalCount,
  filteredCount,
}: {
  statusFilter: Set<OrderStatus>;
  typeFilter: Set<OrderType>;
  dateFrom: string;
  dateTo: string;
  onToggleStatus: (s: OrderStatus) => void;
  onToggleType: (ty: OrderType) => void;
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onClear: () => void;
  totalCount: number;
  filteredCount: number;
}) {
  const t = useTranslations('orders');
  const hasAnyFilter =
    statusFilter.size > 0 || typeFilter.size > 0 || dateFrom !== '' || dateTo !== '';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-[#62716d] dark:text-[#94a3b8]">
          {t('filters.status_label')}
        </span>
        {STATUS_FILTERS.map((s) => (
          <Chip
            key={s}
            active={statusFilter.has(s)}
            onClick={() => onToggleStatus(s)}
            label={t(`filters.${s}`)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-[#62716d] dark:text-[#94a3b8]">
          {t('filters.type_label')}
        </span>
        {TYPE_FILTERS.map((ty) => (
          <Chip
            key={ty}
            active={typeFilter.has(ty)}
            onClick={() => onToggleType(ty)}
            label={t(`filters.type.${ty}`)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-[rgba(22,34,31,0.09)] pt-3 dark:border-[rgba(255,255,255,0.07)]">
        <label className="flex flex-col text-xs font-medium text-[#62716d] dark:text-[#94a3b8]">
          {t('filters.date_from')}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFrom(e.target.value)}
            className="mt-1 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-[#62716d] dark:text-[#94a3b8]">
          {t('filters.date_to')}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateTo(e.target.value)}
            className="mt-1 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white"
          />
        </label>
        <div className="flex-1" />
        <div className="text-xs text-[#62716d] dark:text-[#94a3b8]">
          {t('filters.count_summary', { filtered: filteredCount, total: totalCount })}
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-[rgba(22,34,31,0.09)] px-3 py-2 text-xs font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]"
          >
            {t('filters.clear')}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
        (active
          ? 'bg-[#0f766e] text-white dark:bg-[#14b8a6]'
          : 'bg-[#eef4f3] text-[#16221f] hover:bg-[rgba(22,34,31,0.09)] dark:bg-[#1a2235] dark:text-[#e2e8f0] dark:hover:bg-[rgba(255,255,255,0.07)]')
      }
    >
      {label}
    </button>
  );
}
