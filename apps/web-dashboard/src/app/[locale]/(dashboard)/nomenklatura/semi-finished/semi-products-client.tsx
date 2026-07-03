'use client';

import { cn } from '@mypos/ui';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type SemiProduct, useNomenclatureStore, useNomHydrated } from '@/stores/nomenclature';
import {
  inputClass,
  primaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
} from '../../settings/_components/settings-ui';
import { SemiProductFormDialog } from './semi-product-form-dialog';

const fmtQty = (n: number) => n.toLocaleString('uz-UZ');

export function SemiProductsClient() {
  const hydrated = useNomHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <SemiProductsInner />;
}

type DialogState = SemiProduct | 'new' | null;

function SemiProductsInner() {
  const t = useTranslations('nomenklatura');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const products = useNomenclatureStore((s) => s.semiProducts);
  const categories = useNomenclatureStore((s) => s.semiCategories);
  const deleteSemiProduct = useNomenclatureStore((s) => s.deleteSemiProduct);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [dialog, setDialog] = useState<DialogState>(null);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';
  const catColor = (id: string) => categories.find((c) => c.id === id)?.color ?? '#94a3b8';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, categoryId]);

  const editing: SemiProduct | null = dialog !== null && dialog !== 'new' ? dialog : null;

  function handleDelete(p: SemiProduct) {
    if (!confirm(t('confirm_delete'))) return;
    deleteSemiProduct(p.id);
    toast.success(t('semi.deleted'));
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          className={cn(inputClass, 'w-auto min-w-[200px] flex-1')}
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search_placeholder')}
        />
        <select
          className={cn(inputClass, 'w-auto')}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label={t('category')}
        >
          <option value="all">{t('semi.select_category')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={cn(primaryBtnClass, 'inline-flex items-center gap-1.5')}
          onClick={() => setDialog('new')}
          disabled={categories.length === 0}
        >
          <Plus className="h-4 w-4" /> {t('semi.add')}
        </button>
      </div>

      {categories.length === 0 && (
        <Link
          href={`/${locale}/nomenklatura/semi-finished-categories` as Route}
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
        >
          {t('semi.no_category_hint')} →
        </Link>
      )}

      <SettingsCard>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {products.length === 0 ? t('semi.empty') : t('semi.no_results')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(22,34,31,0.06)] text-left text-[12px] uppercase tracking-wide text-[#62716d] dark:border-[rgba(255,255,255,0.05)] dark:text-[#94a3b8]">
                  <th className="px-2 py-2.5 font-medium">{t('name')}</th>
                  <th className="px-2 py-2.5 font-medium">{t('category')}</th>
                  <th className="px-2 py-2.5 font-medium">{t('unit')}</th>
                  <th className="px-2 py-2.5 text-right font-medium">{t('semi.output_qty')}</th>
                  <th className="px-2 py-2.5" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full',
                            !p.isActive && 'opacity-30',
                          )}
                          style={{ backgroundColor: catColor(p.categoryId) }}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            'font-medium text-[#16221f] dark:text-[#e2e8f0]',
                            !p.isActive && 'opacity-50',
                          )}
                        >
                          {p.name}
                        </span>
                        {!p.isActive && (
                          <span className="rounded-full bg-[rgba(22,34,31,0.07)] px-1.5 py-0.5 text-[10px] font-medium text-[#62716d] dark:bg-white/10 dark:text-[#94a3b8]">
                            {t('inactive')}
                          </span>
                        )}
                      </div>
                      {p.note && (
                        <p className="mt-0.5 max-w-[28ch] truncate text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                          {p.note}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-3 text-[#62716d] dark:text-[#94a3b8]">
                      {catName(p.categoryId)}
                    </td>
                    <td className="px-2 py-3 text-[#62716d] dark:text-[#94a3b8]">
                      {p.unit || '—'}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums [font-feature-settings:'tnum'] text-[#16221f] dark:text-[#e2e8f0]">
                      {fmtQty(p.outputQty)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDialog(p)}
                          className="rounded-lg p-2 text-[#62716d] transition-colors hover:bg-[#eef4f3] hover:text-[#0f766e] active:scale-95 dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
                          aria-label={t('edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="rounded-lg p-2 text-[#62716d] transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:text-[#94a3b8] dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                          aria-label={t('delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      {dialog !== null && (
        <SemiProductFormDialog
          product={editing}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      )}
    </div>
  );
}
