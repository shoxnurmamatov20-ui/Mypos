'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type NomCategory,
  type NomCatKind,
  useNomenclatureStore,
  useNomHydrated,
} from '@/stores/nomenclature';
import {
  primaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
  secondaryBtnClass,
} from '../../settings/_components/settings-ui';
import { NomCategoryFormDialog } from './nom-category-form-dialog';

// ─── Public wrapper (SSR-safe hydration guard) ──────────────────────────────

export function NomCategoryManager({ kind }: { kind: NomCatKind }) {
  const hydrated = useNomHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <NomCategoryManagerInner kind={kind} />;
}

// ─── Inner component (hooks safe — only rendered client-side post-hydration) ─

type DialogState = NomCategory | 'new' | null;

function NomCategoryManagerInner({ kind }: { kind: NomCatKind }) {
  const t = useTranslations('nomenklatura');
  const categories = useNomenclatureStore((s) =>
    kind === 'semi' ? s.semiCategories : s.salesCategories,
  );
  const semiProducts = useNomenclatureStore((s) => (kind === 'semi' ? s.semiProducts : null));
  const deleteCategory = useNomenclatureStore((s) => s.deleteCategory);

  const [dialog, setDialog] = useState<DialogState>(null);

  const productCount = (cat: NomCategory) =>
    kind === 'semi' ? (semiProducts ?? []).filter((p) => p.categoryId === cat.id).length : 0;

  function handleDelete(cat: NomCategory) {
    const count = productCount(cat);
    const message =
      count > 0 ? t('cat.confirm_delete_with_products', { count }) : t('confirm_delete');
    if (!confirm(message)) return;
    deleteCategory(kind, cat.id);
    toast.success(t('cat.deleted'));
  }

  const editing: NomCategory | null = dialog !== null && dialog !== 'new' ? dialog : null;

  return (
    <>
      <SettingsCard>
        <div className="mb-5 flex items-center justify-end">
          <button type="button" onClick={() => setDialog('new')} className={primaryBtnClass}>
            {t('cat.add')}
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <NomCategoryCard
                key={cat.id}
                category={cat}
                count={kind === 'semi' ? productCount(cat) : undefined}
                labelCount={t('count')}
                labelEdit={t('edit')}
                labelDelete={t('delete')}
                labelInactive={t('inactive')}
                onEdit={() => setDialog(cat)}
                onDelete={() => handleDelete(cat)}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('cat.empty')}
          </p>
        )}
      </SettingsCard>

      {dialog !== null && (
        <NomCategoryFormDialog
          kind={kind}
          category={editing}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      )}
    </>
  );
}

// ─── Category card ──────────────────────────────────────────────────────────

interface NomCategoryCardProps {
  category: NomCategory;
  /** Product count (semi-finished categories only); undefined hides the line. */
  count: number | undefined;
  labelCount: string;
  labelEdit: string;
  labelDelete: string;
  labelInactive: string;
  onEdit: () => void;
  onDelete: () => void;
}

function NomCategoryCard({
  category,
  count,
  labelCount,
  labelEdit,
  labelDelete,
  labelInactive,
  onEdit,
  onDelete,
}: NomCategoryCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(18,34,31,0.07)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#16221f] dark:text-white">
            {category.name}
          </p>
          {count !== undefined && (
            <p className="mt-0.5 text-[12px] text-[#62716d] [font-feature-settings:'tnum'] dark:text-[#94a3b8]">
              {count} {labelCount}
            </p>
          )}
        </div>
        {!category.isActive && (
          <span
            className="flex-shrink-0 rounded-full bg-[rgba(22,34,31,0.07)] px-2 py-0.5 text-[11px] font-medium text-[#62716d] dark:bg-white/10 dark:text-[#94a3b8]"
            title={labelInactive}
          >
            {labelInactive}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className={cn(secondaryBtnClass, 'flex-1 text-center text-xs')}
        >
          {labelEdit}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {labelDelete}
        </button>
      </div>
    </div>
  );
}
