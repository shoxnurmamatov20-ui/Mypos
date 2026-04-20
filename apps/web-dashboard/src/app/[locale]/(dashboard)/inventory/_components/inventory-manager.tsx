'use client';

import { inventoryApi, menuApi, type Ingredient, type MenuItem } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { IngredientList } from './ingredient-list';
import { LowStockPanel } from './low-stock-panel';
import { RecipeEditor } from './recipe-editor';

type Tab = 'ingredients' | 'recipes' | 'low_stock';

export function InventoryManager() {
  const t = useTranslations('inventory');
  const [tab, setTab] = useState<Tab>('ingredients');

  const ingredientsQuery = useQuery({
    queryKey: ['inventory', 'ingredients'],
    queryFn: () => inventoryApi.ingredients.list(apiClient, { per_page: 200 }),
  });

  const lowStockQuery = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.lowStock(apiClient),
  });

  const menuItemsQuery = useQuery({
    queryKey: ['menu', 'items', 'for-inventory'],
    queryFn: () => menuApi.items.list(apiClient, { per_page: 200, active_only: true }),
  });

  const ingredients: Ingredient[] = ingredientsQuery.data?.data ?? [];
  const menuItems: MenuItem[] = menuItemsQuery.data?.data ?? [];
  const lowStockCount = lowStockQuery.data?.meta.count ?? 0;

  const refetchAll = (): void => {
    void ingredientsQuery.refetch();
    void lowStockQuery.refetch();
  };

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-neutral-200">
        <TabButton active={tab === 'ingredients'} onClick={() => setTab('ingredients')}>
          {t('tabs.ingredients')} ({ingredients.length})
        </TabButton>
        <TabButton active={tab === 'recipes'} onClick={() => setTab('recipes')}>
          {t('tabs.recipes')}
        </TabButton>
        <TabButton active={tab === 'low_stock'} onClick={() => setTab('low_stock')}>
          {t('tabs.low_stock')}
          {lowStockCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">
              {lowStockCount}
            </span>
          )}
        </TabButton>
      </div>

      {tab === 'ingredients' && (
        <IngredientList
          ingredients={ingredients}
          isLoading={ingredientsQuery.isLoading}
          onChanged={refetchAll}
        />
      )}
      {tab === 'recipes' && (
        <RecipeEditor
          menuItems={menuItems}
          ingredients={ingredients}
          isLoading={menuItemsQuery.isLoading || ingredientsQuery.isLoading}
        />
      )}
      {tab === 'low_stock' && (
        <LowStockPanel
          ingredients={lowStockQuery.data?.data ?? []}
          isLoading={lowStockQuery.isLoading}
          onChanged={refetchAll}
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
