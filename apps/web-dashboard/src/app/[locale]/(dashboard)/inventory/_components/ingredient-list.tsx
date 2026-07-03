'use client';

import type { Ingredient } from '@mypos/api-client';
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
          className="w-full max-w-md rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] p-12 text-center text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.10)] dark:text-[#94a3b8]">
          {t('empty_ingredients')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
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
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {filtered.map((ing) => (
                <tr key={ing.id} className="hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#16221f] dark:text-white">{ing.name.uz}</div>
                    {ing.sku && (
                      <div className="text-xs text-[#62716d] dark:text-[#94a3b8]">{ing.sku}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[#eef4f3] px-2 py-0.5 text-xs text-[#16221f] dark:bg-[#1a2235] dark:text-[#e2e8f0]">
                      {ing.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StockLevelBar ingredient={ing} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#16221f] dark:text-white">
                    {ing.current_stock.toLocaleString('uz', { maximumFractionDigits: 3 })}
                  </td>
                  <td className="px-4 py-3 text-right text-[#62716d] dark:text-[#94a3b8]">
                    {ing.min_stock !== null
                      ? ing.min_stock.toLocaleString('uz', { maximumFractionDigits: 3 })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-[#62716d] dark:text-[#94a3b8]">
                    {ing.cost_per_unit.toLocaleString('uz')} UZS
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setAdjusting(ing)}
                      className="rounded-lg bg-[#0f766e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
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
