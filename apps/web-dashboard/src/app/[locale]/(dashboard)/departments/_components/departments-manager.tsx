'use client';

import { type Department, departmentsApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { DepartmentList } from './department-list';

type ActiveFilter = '' | '1' | '0';

export function DepartmentsManager() {
  const t = useTranslations('departments');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<ActiveFilter>('');

  const departmentsQuery = useQuery({
    queryKey: ['departments', q, active],
    queryFn: () =>
      departmentsApi.list(apiClient, {
        q: q || undefined,
        is_active: active === '' ? undefined : active === '1',
        per_page: 100,
      }),
  });

  const departments: Department[] = departmentsQuery.data?.data ?? [];
  const total: number = departments.length;
  const activeCount = departments.filter((d) => d.is_active).length;
  const inactiveCount = total - activeCount;
  const employeesTotal = departments.reduce((sum, d) => sum + (d.employees_count ?? 0), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip label={t('summary.total')} value={total} tone="brand" />
          <Chip label={t('summary.active')} value={activeCount} tone="ok" />
          <Chip label={t('summary.inactive')} value={inactiveCount} tone="muted" />
          <Chip label={t('summary.employees')} value={employeesTotal} tone="muted" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full max-w-md rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-sm text-[#16221f] dark:text-white focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none"
        />
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as ActiveFilter)}
          className="rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-sm text-[#16221f] dark:text-white"
        >
          <option value="">{t('filter_status_all')}</option>
          <option value="1">{t('status.active')}</option>
          <option value="0">{t('status.inactive')}</option>
        </select>
        <span className="ml-auto text-sm text-[#62716d] dark:text-[#94a3b8]">
          {total} {t('total_suffix')}
        </span>
      </div>

      <DepartmentList
        departments={departments}
        isLoading={departmentsQuery.isLoading}
        onChanged={() => {
          void departmentsQuery.refetch();
        }}
      />
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'brand' | 'ok' | 'muted';
}) {
  const toneCls =
    tone === 'brand'
      ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60'
      : tone === 'ok'
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
        : 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#62716d] dark:text-[#94a3b8] border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${toneCls}`}
    >
      {label}
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}
