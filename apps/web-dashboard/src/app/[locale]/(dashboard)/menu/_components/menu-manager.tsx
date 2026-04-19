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
      <div className="mb-6 flex gap-2 border-b border-neutral-200">
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
        (active ? 'text-brand-600' : 'text-neutral-500 hover:text-neutral-900')
      }
    >
      {children}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />}
    </button>
  );
}
