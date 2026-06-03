'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@mypos/ui';
import {
  type FinanceCategory,
  type FinanceKind,
  categoriesByKind,
  useFinanceHydrated,
  useFinanceStore,
} from '@/stores/finance';
import {
  SettingsCard,
  SettingsSkeleton,
  primaryBtnClass,
  secondaryBtnClass,
} from '../../settings/_components/settings-ui';
import { CategoryFormDialog } from './category-form-dialog';

// ─── Public wrapper (SSR-safe hydration guard) ──────────────────────────────

export function CategoryManager({ kind }: { kind: FinanceKind }) {
  const hydrated = useFinanceHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <CategoryManagerInner kind={kind} />;
}

// ─── Inner component (hooks safe — only rendered client-side post-hydration) ─

type DialogState = FinanceCategory | 'new' | null;

function CategoryManagerInner({ kind }: { kind: FinanceKind }) {
  const t = useTranslations('finance');
  const categories = useFinanceStore((s) => s.categories);
  const operations = useFinanceStore((s) => s.operations);
  const deleteCategory = useFinanceStore((s) => s.deleteCategory);

  const list = categoriesByKind(categories, kind);

  const [dialog, setDialog] = useState<DialogState>(null);

  function handleDelete(cat: FinanceCategory) {
    if (!confirm(t('confirm_delete'))) return;
    deleteCategory(cat.id);
    toast.success(t('categories.cat_deleted'));
  }

  const editingCategory: FinanceCategory | null =
    dialog !== null && dialog !== 'new' ? dialog : null;

  return (
    <>
      <SettingsCard>
        {/* Header row */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">
            {list.length > 0
              ? `${list.length} ${t('categories.ops_count')}`
              : t('categories.empty')}
          </p>
          <button
            type="button"
            onClick={() => setDialog('new')}
            className={primaryBtnClass}
          >
            {t('categories.add')}
          </button>
        </div>

        {/* Category grid */}
        {list.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((cat) => {
              const opsCount = operations.filter((o) => o.categoryId === cat.id).length;
              return (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  opsCount={opsCount}
                  onEdit={() => setDialog(cat)}
                  onDelete={() => handleDelete(cat)}
                  labelEdit={t('edit')}
                  labelDelete={t('delete')}
                  labelOps={t('categories.ops_count')}
                  labelInactive={t('inactive')}
                />
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('categories.empty')}
          </p>
        )}
      </SettingsCard>

      {/* Dialog */}
      {dialog !== null && (
        <CategoryFormDialog
          kind={kind}
          category={editingCategory}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      )}
    </>
  );
}

// ─── Category card ──────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: FinanceCategory;
  opsCount: number;
  onEdit: () => void;
  onDelete: () => void;
  labelEdit: string;
  labelDelete: string;
  labelOps: string;
  labelInactive: string;
}

function CategoryCard({
  category,
  opsCount,
  onEdit,
  onDelete,
  labelEdit,
  labelDelete,
  labelOps,
  labelInactive,
}: CategoryCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(18,34,31,0.07)]">
      {/* Top row: swatch + name + inactive badge */}
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
          <p className="mt-0.5 text-[12px] text-[#62716d] dark:text-[#94a3b8] [font-feature-settings:'tnum']">
            {opsCount} {labelOps}
          </p>
        </div>
        {!category.isActive && (
          <span
            className="flex-shrink-0 rounded-full bg-[rgba(22,34,31,0.07)] dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-[#62716d] dark:text-[#94a3b8]"
            title={labelInactive}
          >
            {labelInactive}
          </span>
        )}
      </div>

      {/* Action buttons */}
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
          className="flex-1 rounded-lg border border-red-200 dark:border-red-900/40 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-[0.98]"
        >
          {labelDelete}
        </button>
      </div>
    </div>
  );
}
