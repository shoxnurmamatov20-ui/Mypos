'use client';

import {
  inventoryApi,
  type Ingredient,
  type MenuItem,
  type Recipe,
} from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export function RecipeEditor({
  menuItems,
  ingredients,
  isLoading,
}: {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  isLoading: boolean;
}) {
  const t = useTranslations('inventory');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  const recipesQuery = useQuery({
    queryKey: ['inventory', 'recipes', selectedMenuId],
    enabled: selectedMenuId !== null,
    queryFn: () =>
      inventoryApi.recipes.list(apiClient, {
        menu_item_id: selectedMenuId ?? undefined,
      }),
  });

  const [ingredientId, setIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [isOptional, setIsOptional] = useState<boolean>(false);

  const addRecipe = async (): Promise<void> => {
    if (selectedMenuId === null || ingredientId === '' || Number(quantity) <= 0 || unit === '') {
      toast.error(t('recipe_invalid'));
      return;
    }
    try {
      await inventoryApi.recipes.create(apiClient, {
        menu_item_id: selectedMenuId,
        ingredient_id: ingredientId,
        quantity: Number(quantity),
        unit,
        is_optional: isOptional,
      });
      toast.success(t('recipe_added'));
      setIngredientId('');
      setQuantity('');
      setUnit('');
      setIsOptional(false);
      void recipesQuery.refetch();
    } catch {
      toast.error(t('recipe_add_failed'));
    }
  };

  const deleteRecipe = async (r: Recipe): Promise<void> => {
    if (!confirm(t('confirm_delete_recipe'))) return;
    try {
      await inventoryApi.recipes.delete(apiClient, r.id);
      toast.success(t('recipe_deleted'));
      void recipesQuery.refetch();
    } catch {
      toast.error(t('recipe_delete_failed'));
    }
  };

  if (isLoading) return <div className="text-sm text-neutral-500">{t('loading')}</div>;

  const recipes: Recipe[] = recipesQuery.data?.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
      <aside className="rounded-xl border border-neutral-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-semibold text-neutral-700">
          {t('pick_menu_item')}
        </h3>
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
          {menuItems.map((mi) => (
            <li key={mi.id}>
              <button
                type="button"
                onClick={() => setSelectedMenuId(mi.id)}
                className={
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition ' +
                  (selectedMenuId === mi.id
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'hover:bg-neutral-50')
                }
              >
                {mi.name.uz}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        {selectedMenuId === null ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
            {t('pick_menu_item_hint')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-neutral-700">
                {t('add_ingredient')}
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                <select
                  value={ingredientId}
                  onChange={(e) => {
                    setIngredientId(e.target.value);
                    const ing = ingredients.find((i) => i.id === e.target.value);
                    if (ing) setUnit(ing.unit);
                  }}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="">{t('choose_ingredient')}</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name.uz} ({ing.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t('quantity')}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t('unit')}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addRecipe}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  +
                </button>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  checked={isOptional}
                  onChange={(e) => setIsOptional(e.target.checked)}
                />
                {t('is_optional')}
              </label>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-2 text-left">{t('cols.ingredient')}</th>
                    <th className="px-4 py-2 text-right">{t('cols.quantity')}</th>
                    <th className="px-4 py-2 text-left">{t('cols.unit')}</th>
                    <th className="px-4 py-2 text-center">{t('cols.optional')}</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recipes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                        {t('no_recipes')}
                      </td>
                    </tr>
                  )}
                  {recipes.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-medium">
                        {r.ingredient?.name.uz ?? r.ingredient_id}
                      </td>
                      <td className="px-4 py-2 text-right">{r.quantity}</td>
                      <td className="px-4 py-2">{r.unit}</td>
                      <td className="px-4 py-2 text-center">{r.is_optional ? '✓' : '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => deleteRecipe(r)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
