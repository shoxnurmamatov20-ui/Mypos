'use client';

import { type Table, type TableCategory, tablesApi } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { FloorPlan } from './floor-plan';
import { TableCategoryManager } from './table-category-manager';
import { TableList } from './table-list';

type ViewMode = 'list' | 'floor_plan';

export function TablesManager() {
  const t = useTranslations('tables');
  const [view, setView] = useState<ViewMode>('list');

  const categoriesQuery = useQuery({
    queryKey: ['tables', 'categories'],
    queryFn: () => tablesApi.categories.list(apiClient),
  });

  const tablesQuery = useQuery({
    queryKey: ['tables', 'list'],
    queryFn: () => tablesApi.tables.list(apiClient),
  });

  const categories: TableCategory[] = categoriesQuery.data?.data ?? [];
  const tables: Table[] = tablesQuery.data?.data ?? [];

  const refetchAll = () => {
    void tablesQuery.refetch();
    void categoriesQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <TableCategoryManager
        categories={categories}
        isLoading={categoriesQuery.isLoading}
        onChanged={refetchAll}
      />

      <div className="flex items-center justify-between border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] pb-3">
        <div className="flex gap-1 rounded-lg bg-[#eef4f3] dark:bg-[#1a2235] p-1">
          <ViewButton active={view === 'list'} onClick={() => setView('list')}>
            {t('views.list')}
          </ViewButton>
          <ViewButton active={view === 'floor_plan'} onClick={() => setView('floor_plan')}>
            {t('views.floor_plan')}
          </ViewButton>
        </div>
        <span className="text-sm text-[#62716d] dark:text-[#94a3b8]">
          {tables.length} {t('tables_count_suffix')}
        </span>
      </div>

      {view === 'list' ? (
        <TableList
          tables={tables}
          categories={categories}
          isLoading={tablesQuery.isLoading}
          onChanged={refetchAll}
        />
      ) : (
        <FloorPlan tables={tables} isLoading={tablesQuery.isLoading} />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-white dark:bg-[#111827] text-[#16221f] dark:text-white'
          : 'text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
