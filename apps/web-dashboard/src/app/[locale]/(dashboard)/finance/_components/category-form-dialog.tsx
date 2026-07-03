'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { type FinanceCategory, type FinanceKind, useFinanceStore } from '@/stores/finance';
import {
  Field,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  Toggle,
} from '../../settings/_components/settings-ui';

interface Props {
  kind: FinanceKind;
  /** Existing category when editing; null/undefined when creating. */
  category: FinanceCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CategoryFormDialog({ kind, category, onClose, onSaved }: Props) {
  const t = useTranslations('finance');
  const addCategory = useFinanceStore((s) => s.addCategory);
  const updateCategory = useFinanceStore((s) => s.updateCategory);

  const isEdit = category !== null && category !== undefined;

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '#10b981');
  const [isActive, setIsActive] = useState<boolean>(category?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSubmitting(false);
      return;
    }

    if (isEdit && category) {
      updateCategory(category.id, { name: trimmedName, color, isActive });
      toast.success(t('categories.cat_updated'));
    } else {
      addCategory({ name: trimmedName, color, isActive, kind });
      toast.success(t('categories.cat_created'));
    }

    setSubmitting(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-xl font-semibold text-[#16221f] dark:text-white">
          {isEdit ? t('edit') : t('categories.add')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <Field label={t('name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
              className={inputClass}
            />
          </Field>

          {/* Color */}
          <Field label={t('color')}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-1"
              />
              <span className="font-mono text-sm text-[#62716d] dark:text-[#94a3b8] [font-feature-settings:'tnum']">
                {color}
              </span>
            </div>
          </Field>

          {/* Active toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('active')}
            </span>
            <Toggle checked={isActive} onChange={setIsActive} ariaLabel={t('active')} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] pt-4">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || name.trim().length === 0}
              className={cn(primaryBtnClass)}
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
