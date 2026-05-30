'use client';

import { customersApi, type Customer } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { CustomerList } from './customer-list';

export function CustomersManager() {
  const t = useTranslations('customers');
  const [q, setQ] = useState('');

  const customersQuery = useQuery({
    queryKey: ['customers', q],
    queryFn: () => customersApi.list(apiClient, { q: q || undefined, per_page: 50 }),
  });

  const customers: Customer[] = customersQuery.data?.data ?? [];
  const total: number = customersQuery.data?.meta?.total ?? 0;

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
        <span className="ml-auto text-sm text-[#62716d] dark:text-[#94a3b8]">
          {total} {t('total_suffix')}
        </span>
      </div>

      <CustomerList
        customers={customers}
        isLoading={customersQuery.isLoading}
        onChanged={() => {
          void customersQuery.refetch();
        }}
      />
    </div>
  );
}
