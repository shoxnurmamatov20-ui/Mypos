'use client';

import { type Ingredient, inventoryApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';

type Props = {
  value: string | '';
  onChange: (ingredient: Ingredient | null) => void;
  /** Exclude these ingredient ids (already-picked rows). */
  excludeIds?: string[];
  className?: string;
};

/**
 * Lightweight combobox for picking an ingredient by name. Loads the active
 * ingredient list (per_page=200) once and filters client-side — keeps the UX
 * snappy on small/medium catalogs while staying SDK-only.
 */
export function IngredientSearch({ value, onChange, excludeIds = [], className }: Props) {
  const t = useTranslations('inventory');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const ingredientsQuery = useQuery({
    queryKey: ['inventory', 'ingredients', 'all'],
    queryFn: () => inventoryApi.ingredients.list(apiClient, { active_only: true, per_page: 500 }),
    staleTime: 60_000,
  });

  const ingredients: Ingredient[] = ingredientsQuery.data?.data ?? [];
  const selected = ingredients.find((i) => i.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients
      .filter((i) => !excludeIds.includes(i.id) || i.id === value)
      .filter((i) => {
        if (q === '') return true;
        return (
          i.name.uz.toLowerCase().includes(q) ||
          i.name.ru.toLowerCase().includes(q) ||
          i.name.en.toLowerCase().includes(q) ||
          (i.sku ?? '').toLowerCase().includes(q)
        );
      })
      .slice(0, 50);
  }, [ingredients, query, excludeIds, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-left text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500"
      >
        <span className="truncate">
          {selected ? (
            <>
              <span className="font-medium">{selected.name.uz}</span>
              <span className="ml-1 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                ({selected.unit})
              </span>
            </>
          ) : (
            <span className="text-[#62716d] dark:text-[#94a3b8]">
              {t('form.select_ingredient')}
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#62716d] dark:text-[#94a3b8]" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] bg-white shadow-lg dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <div className="border-b border-[rgba(22,34,31,0.09)] p-2 dark:border-[rgba(255,255,255,0.07)]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#62716d] dark:text-[#94a3b8]" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('form.search_ingredient')}
                className="w-full rounded border-0 bg-[#eef4f3] px-2 py-1.5 pl-7 text-xs text-[#16221f] outline-none focus:bg-white focus:ring-1 focus:ring-[#0f766e] dark:bg-[#1a2235] dark:text-white dark:focus:bg-[#0d1424] dark:focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#62716d] dark:text-[#94a3b8]">
                —
              </div>
            ) : (
              filtered.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    onChange(i);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
                >
                  <span className="min-w-0 flex-1 truncate text-[#16221f] dark:text-white">
                    {i.name.uz}
                    {i.sku ? (
                      <span className="ml-1 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                        · {i.sku}
                      </span>
                    ) : null}
                  </span>
                  <span className="rounded bg-[#eef4f3] px-1.5 py-0.5 text-[10px] uppercase text-[#16221f] dark:bg-[#0d1424] dark:text-[#e2e8f0]">
                    {i.unit}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
