'use client';

import { menuApi, type MenuCategory, type MenuItem } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { CategoryList } from './category-list';
import { ItemList } from './item-list';

type Tab = 'categories' | 'items';

export function MenuManager() {
  const t = useTranslations('menu');
  const [tab, setTab] = useState<Tab>('categories');

  const categoriesQuery = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuApi.categories.list(apiClient),
  });

  const itemsQuery = useQuery({
    queryKey: ['menu', 'items'],
    queryFn: () => menuApi.items.list(apiClient),
  });

  const categories: MenuCategory[] = categoriesQuery.data?.data ?? [];
  const items: MenuItem[] = itemsQuery.data?.data ?? [];

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
        <TabButton active={tab === 'categories'} onClick={() => setTab('categories')}>
          {t('tabs.categories')} ({categories.length})
        </TabButton>
        <TabButton active={tab === 'items'} onClick={() => setTab('items')}>
          {t('tabs.items')} ({itemsQuery.data?.meta?.total ?? 0})
        </TabButton>
      </div>

      {tab === 'categories' && (
        <CategoryList
          categories={categories}
          isLoading={categoriesQuery.isLoading}
          onChanged={() => {
            void categoriesQuery.refetch();
          }}
        />
      )}
      {tab === 'items' && (
        <ItemList
          items={items}
          categories={categories}
          isLoading={itemsQuery.isLoading}
          onChanged={() => {
            void itemsQuery.refetch();
            void categoriesQuery.refetch(); // refresh item counts
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'relative px-4 py-3 text-sm font-medium transition ' +
        (active
          ? 'text-[#0f766e] dark:text-teal-400'
          : 'text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white')
      }
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f766e] dark:bg-teal-500" />
      )}
    </button>
  );
}
