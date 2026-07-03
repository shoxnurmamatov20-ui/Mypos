'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { type NomCategory, type NomCatKind, useNomenclatureStore } from '@/stores/nomenclature';
import {
  Field,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  Toggle,
} from '../../settings/_components/settings-ui';

interface Props {
  kind: NomCatKind;
  /** Existing category when editing; null when creating. */
  category: NomCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NomCategoryFormDialog({ kind, category, onClose, onSaved }: Props) {
  const t = useTranslations('nomenklatura');
  const addCategory = useNomenclatureStore((s) => s.addCategory);
  const updateCategory = useNomenclatureStore((s) => s.updateCategory);

  const isEdit = category !== null;

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '#10b981');
  const [isActive, setIsActive] = useState<boolean>(category?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const headingId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSubmitting(true);
    if (isEdit && category) {
      updateCategory(kind, category.id, { name: trimmedName, color, isActive });
      toast.success(t('cat.updated'));
    } else {
      addCategory(kind, { name: trimmedName, color, isActive });
      toast.success(t('cat.created'));
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
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={headingId} className="mb-5 text-xl font-semibold text-[#16221f] dark:text-white">
          {isEdit ? t('cat.edit') : t('cat.add')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label={t('color')}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label={t('color')}
                className="h-10 w-16 cursor-pointer rounded-lg border border-[rgba(22,34,31,0.09)] bg-white p-1 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]"
              />
              <span className="font-mono text-sm text-[#62716d] [font-feature-settings:'tnum'] dark:text-[#94a3b8]">
                {color}
              </span>
            </div>
          </Field>

          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('active')}
            </span>
            <Toggle checked={isActive} onChange={setIsActive} ariaLabel={t('active')} />
          </div>

          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.06)] pt-4 dark:border-[rgba(255,255,255,0.05)]">
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
