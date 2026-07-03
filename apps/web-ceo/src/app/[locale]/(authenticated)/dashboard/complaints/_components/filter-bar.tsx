'use client';

import { Search, X } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { ComplaintFilters, ComplaintSeverity, ComplaintStatus } from '@/lib/api';

type T = ReturnType<typeof useTranslations>;

export function FilterBar({
  filters,
  statuses,
  severities,
  regions,
  onChange,
  onReset,
  t,
}: {
  filters: ComplaintFilters;
  statuses: ComplaintStatus[];
  severities: ComplaintSeverity[];
  regions: string[];
  onChange: (patch: Partial<ComplaintFilters>) => void;
  onReset: () => void;
  t: T;
}) {
  const hasAny =
    !!filters.q ||
    !!filters.status ||
    !!filters.severity ||
    !!filters.region ||
    !!filters.urgent ||
    !!filters.stale;

  return (
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62716d] dark:text-[#94a3b8]" />
          <input
            type="text"
            value={filters.q ?? ''}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder={t('search_placeholder')}
            className="h-9 w-full pl-8 pr-3 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] text-[13px] text-[#16221f] dark:text-white placeholder:text-[#94a3b8]"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => onChange({ status: (e.target.value || '') as ComplaintStatus | '' })}
          className="h-9 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] px-2 text-[13px] text-[#16221f] dark:text-white"
        >
          <option value="">
            {t('filter_status')}: {t('filter_all')}
          </option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={filters.severity ?? ''}
          onChange={(e) => onChange({ severity: (e.target.value || '') as ComplaintSeverity | '' })}
          className="h-9 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] px-2 text-[13px] text-[#16221f] dark:text-white"
        >
          <option value="">
            {t('filter_severity')}: {t('filter_all')}
          </option>
          {severities.map((s) => (
            <option key={s} value={s}>
              {t(`severity.${s}`)}
            </option>
          ))}
        </select>

        {/* Region */}
        {regions.length > 0 ? (
          <select
            value={filters.region ?? ''}
            onChange={(e) => onChange({ region: e.target.value || '' })}
            className="h-9 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] px-2 text-[13px] text-[#16221f] dark:text-white"
          >
            <option value="">
              {t('filter_region')}: {t('filter_all')}
            </option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : null}

        {/* Urgent toggle */}
        <label className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] text-[12px] font-semibold text-[#16221f] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={filters.urgent ?? false}
            onChange={(e) => onChange({ urgent: e.target.checked })}
            className="w-3.5 h-3.5 accent-red-500"
          />
          {t('filter_urgent')}
        </label>

        {/* Stale toggle */}
        <label className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] text-[12px] font-semibold text-[#16221f] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={filters.stale ?? false}
            onChange={(e) => onChange({ stale: e.target.checked })}
            className="w-3.5 h-3.5 accent-orange-500"
          />
          {t('filter_stale')}
        </label>

        {/* Reset */}
        {hasAny ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-md text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-3.5 h-3.5" /> {t('reset_filters')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
