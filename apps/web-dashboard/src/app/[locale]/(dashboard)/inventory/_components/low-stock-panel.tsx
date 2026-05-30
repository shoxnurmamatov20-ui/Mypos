'use client';

import { type Ingredient } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AdjustStockDialog } from './adjust-stock-dialog';

export function LowStockPanel({
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

  if (isLoading) {
    return (
      <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-12 text-center dark:border-emerald-900/50 dark:bg-emerald-950/50">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t('low_stock_ok')}
        </p>
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
          {t('low_stock_ok_hint')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        {t('low_stock_warning', { count: ingredients.length })}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            className="rounded-xl border border-red-200 bg-white p-4 dark:border-red-900/50 dark:bg-[#111827]"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="font-semibold text-[#16221f] dark:text-white">
                  {ing.name.uz}
                </div>
                {ing.sku && (
                  <div className="text-xs text-[#62716d] dark:text-[#94a3b8]">
                    {ing.sku}
                  </div>
                )}
              </div>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {t('low')}
              </span>
            </div>
            <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">
              <div>
                {t('current')}: <strong>{ing.current_stock}</strong> {ing.unit}
              </div>
              <div>
                {t('min')}: {ing.min_stock ?? '—'} {ing.unit}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdjusting(ing)}
              className="mt-3 w-full rounded-lg bg-[#0f766e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
            >
              {t('adjust')}
            </button>
          </div>
        ))}
      </div>
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
