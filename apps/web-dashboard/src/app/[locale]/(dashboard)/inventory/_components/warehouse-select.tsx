'use client';

import { type Warehouse, warehousesApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Props = {
  value: string | '';
  onChange: (id: string) => void;
  /** Add a "all warehouses" sentinel option (filter mode). */
  includeAll?: boolean;
  /** Exclude one warehouse id (used by transfer "to" select). */
  excludeId?: string;
  className?: string;
  disabled?: boolean;
  /** Visible placeholder when `value === ''`. */
  placeholder?: string;
};

const baseClass =
  'w-full rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500 disabled:opacity-50';

export function WarehouseSelect({
  value,
  onChange,
  includeAll = false,
  excludeId,
  className,
  disabled,
  placeholder,
}: Props) {
  const t = useTranslations('inventory');

  const query = useQuery({
    queryKey: ['warehouses', 'list', 'active'],
    queryFn: () => warehousesApi.list(apiClient, { active_only: true, per_page: 100 }),
    staleTime: 60_000,
  });

  const warehouses: Warehouse[] = (query.data?.data as Warehouse[] | undefined) ?? [];
  const visible = excludeId ? warehouses.filter((w) => w.id !== excludeId) : warehouses;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || query.isLoading}
      className={className ? `${baseClass} ${className}` : baseClass}
    >
      {includeAll ? (
        <option value="">{t('filters.all_warehouses')}</option>
      ) : (
        <option value="" disabled>
          {placeholder ?? t('form.select_warehouse')}
        </option>
      )}
      {visible.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}

/** Helper hook so non-select callers can list active warehouses. */
export function useActiveWarehouses() {
  return useQuery({
    queryKey: ['warehouses', 'list', 'active'],
    queryFn: () => warehousesApi.list(apiClient, { active_only: true, per_page: 100 }),
    staleTime: 60_000,
  });
}
