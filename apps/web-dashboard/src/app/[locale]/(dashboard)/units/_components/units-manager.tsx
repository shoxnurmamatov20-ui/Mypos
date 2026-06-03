'use client';

import { type UnitOfMeasure, unitsApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { UnitsList } from './units-list';

export function UnitsManager() {
  const t = useTranslations('units');
  const [q, setQ] = useState('');

  const unitsQuery = useQuery({
    queryKey: ['units', q],
    queryFn: () => unitsApi.list(apiClient, { q: q || undefined, per_page: 100 }),
  });

  const units: UnitOfMeasure[] = unitsQuery.data?.data ?? [];
  const total: number = unitsQuery.data?.meta?.total ?? 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full max-w-md rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2 text-sm focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none"
        />
        <span className="ml-auto text-sm text-[#62716d] dark:text-[#94a3b8]">{total}</span>
      </div>

      <UnitsList
        units={units}
        isLoading={unitsQuery.isLoading}
        onChanged={() => {
          void unitsQuery.refetch();
        }}
      />
    </div>
  );
}
