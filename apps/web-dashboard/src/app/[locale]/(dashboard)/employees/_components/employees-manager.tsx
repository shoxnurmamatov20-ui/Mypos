'use client';

import { employeesApi, type Employee, type EmployeeStatus } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { EmployeeList } from './employee-list';

export function EmployeesManager() {
  const t = useTranslations('employees');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<EmployeeStatus | ''>('');

  const employeesQuery = useQuery({
    queryKey: ['employees', q, status],
    queryFn: () => employeesApi.list(apiClient, {
      q: q || undefined,
      status: (status || undefined) as EmployeeStatus | undefined,
      per_page: 50,
    }),
  });

  const employees: Employee[] = employeesQuery.data?.data ?? [];
  const total: number = employeesQuery.data?.meta?.total ?? 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EmployeeStatus | '')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">{t('filter_status_all')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="on_leave">{t('status.on_leave')}</option>
          <option value="terminated">{t('status.terminated')}</option>
        </select>
        <span className="ml-auto text-sm text-neutral-500">
          {total} {t('total_suffix')}
        </span>
      </div>

      <EmployeeList
        employees={employees}
        isLoading={employeesQuery.isLoading}
        onChanged={() => {
          void employeesQuery.refetch();
        }}
      />
    </div>
  );
}
