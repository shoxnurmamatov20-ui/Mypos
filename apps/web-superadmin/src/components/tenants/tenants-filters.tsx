'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { PlanFilter, StatusFilter } from '@/lib/tenant-utils';

export type OwnerFilter = 'all' | 'has' | 'missing';

type Props = {
  query: string;
  onQueryChange: (next: string) => void;
  plan: PlanFilter;
  onPlanChange: (next: PlanFilter) => void;
  status: StatusFilter;
  onStatusChange: (next: StatusFilter) => void;
  region: string;
  onRegionChange: (next: string) => void;
  owner: OwnerFilter;
  onOwnerChange: (next: OwnerFilter) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

const REGIONS = [
  { code: '', name: 'Hamma viloyatlar' },
  { code: 'tas', name: 'Toshkent' },
  { code: 'sam', name: 'Samarqand' },
  { code: 'buk', name: 'Buxoro' },
  { code: 'and', name: 'Andijon' },
  { code: 'fer', name: "Farg'ona" },
  { code: 'nam', name: 'Namangan' },
  { code: 'kar', name: 'Qashqadaryo' },
  { code: 'sur', name: 'Surxondaryo' },
  { code: 'jiz', name: 'Jizzax' },
  { code: 'sir', name: 'Sirdaryo' },
  { code: 'nav', name: 'Navoiy' },
  { code: 'kho', name: 'Xorazm' },
  { code: 'kar2', name: "Qoraqalpog'iston" },
];

/**
 * himoya `.orgm-filters` bar — search input on the left, 4 native
 * `<select>` dropdowns (region / plan / owner / status), and a
 * "Tozalash" reset on the far right. Wraps cleanly on small screens
 * with each select taking the full row width when needed.
 */
export function TenantsFilters({
  query,
  onQueryChange,
  plan,
  onPlanChange,
  status,
  onStatusChange,
  region,
  onRegionChange,
  owner,
  onOwnerChange,
  onClear,
  hasActiveFilters,
}: Props) {
  const t = useTranslations('tenants_page');
  const tPlans = useTranslations('plans');
  const tStatuses = useTranslations('statuses');

  const fieldClass = cn(
    'h-8 pl-2.5 pr-7 rounded-md border text-[12px] font-semibold cursor-pointer outline-none transition-colors',
    'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
    'bg-white dark:bg-[#111827] text-[#16221f] dark:text-white',
    'hover:border-[rgba(15,118,110,0.30)] dark:hover:border-[rgba(20,184,166,0.30)]',
    'focus-visible:border-[#0f766e] dark:focus-visible:border-[#14b8a6]',
    'focus-visible:ring-2 focus-visible:ring-[rgba(15,118,110,0.15)] dark:focus-visible:ring-[rgba(20,184,166,0.18)]',
    'min-w-0 flex-1 sm:flex-none',
  );

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:flex-wrap px-3.5 py-2.5 rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]"
      role="region"
      aria-label="Tenant filtrlash"
    >
      {/* Search */}
      <div className="relative col-span-2 sm:col-auto sm:flex-1 sm:min-w-[220px]">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62716d] dark:text-[#94a3b8]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Qidiruv: nom, slug, email..."
          autoComplete="off"
          aria-label="Tenant qidirish"
          className="h-8 w-full pl-8 pr-2.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[12px] font-medium text-[#16221f] dark:text-white placeholder:text-[#62716d] dark:placeholder:text-[#94a3b8] outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] focus:ring-2 focus:ring-[rgba(15,118,110,0.15)] dark:focus:ring-[rgba(20,184,166,0.18)] transition-colors"
        />
      </div>

      <select
        value={region}
        onChange={(e) => onRegionChange(e.target.value)}
        className={fieldClass}
        aria-label="Viloyat"
      >
        {REGIONS.map((r) => (
          <option key={r.code || 'all'} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>

      <select
        value={plan}
        onChange={(e) => onPlanChange(e.target.value as PlanFilter)}
        className={fieldClass}
        aria-label="Tarif"
      >
        <option value="all">Plan: {t('filter_all')}</option>
        <option value="free">{tPlans('free')}</option>
        <option value="starter">{tPlans('starter')}</option>
        <option value="pro">{tPlans('pro')}</option>
        <option value="business">{tPlans('business')}</option>
        <option value="enterprise">{tPlans('enterprise')}</option>
      </select>

      <select
        value={owner}
        onChange={(e) => onOwnerChange(e.target.value as OwnerFilter)}
        className={fieldClass}
        aria-label="Egasi"
      >
        <option value="all">Egasi: hammasi</option>
        <option value="has">Egasi bor</option>
        <option value="missing">Egasiz</option>
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className={fieldClass}
        aria-label="Holat"
      >
        <option value="all">Holat: hammasi</option>
        <option value="active">{tStatuses('active')}</option>
        <option value="trialing">{tStatuses('trialing')}</option>
        <option value="past_due">{tStatuses('past_due')}</option>
        <option value="suspended">{tStatuses('suspended')}</option>
        <option value="cancelled">{tStatuses('cancelled')}</option>
      </select>

      <button
        type="button"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className={cn(
          'col-span-2 sm:col-auto px-2.5 py-1.5 rounded-md border bg-transparent text-[#62716d] dark:text-[#94a3b8] text-[11px] font-semibold transition-colors',
          'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
          'hover:text-[#16221f] dark:hover:text-white hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        Tozalash
      </button>
    </div>
  );
}
