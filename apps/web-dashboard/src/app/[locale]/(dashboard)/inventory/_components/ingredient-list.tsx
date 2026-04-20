'use client';

import { type Ingredient } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { StockLevelBar } from './stock-level-bar';

export function IngredientList({
  ingredients,
  isLoading,
  onChanged,
}: {
  ingredients: Ingredient[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('inventory');
  const [adjusting, setAdjusting] = useState<Ingredient | null>(null);
  const [query, setQuery] = useState('');

  const filtered = ingredients.filter((i) => {
    if (query.trim() === '') return true;
    const q = query.toLowerCase();
    return (
      i.name.uz.toLowerCase().includes(q) ||
      i.name.ru.toLowerCase().includes(q) ||
      i.name.en.toLowerCase().includes(q) ||
      (i.sku ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full max-w-md rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
          {t('empty_ingredients')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">{t('cols.name')}</th>
                <th className="px-4 py-3 text-left">{t('cols.unit')}</th>
                <th className="px-4 py-3 text-left">{t('cols.stock_level')}</th>
                <th className="px-4 py-3 text-right">{t('cols.current')}</th>
                <th className="px-4 py-3 text-right">{t('cols.min')}</th>
                <th className="px-4 py-3 text-right">{t('cols.cost')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((ing) => (
                <tr key={ing.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{ing.name.uz}</div>
                    {ing.sku && <div className="text-xs text-neutral-400">{ing.sku}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{ing.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StockLevelBar ingredient={ing} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {ing.current_stock.toLocaleString('uz', { maximumFractionDigits: 3 })}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {ing.min_stock !== null
                      ? ing.min_stock.toLocaleString('uz', { maximumFractionDigits: 3 })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600">
                    {ing.cost_per_unit.toLocaleString('uz')} UZS
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setAdjusting(ing)}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      {t('adjust')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjusting !== null && (
        <AdjustStockDialog
          ingredient={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            setAdjusting(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
