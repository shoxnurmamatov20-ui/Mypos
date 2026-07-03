'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { type SemiProduct, useNomenclatureStore } from '@/stores/nomenclature';
import {
  Field,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  Toggle,
} from '../../settings/_components/settings-ui';

interface Props {
  /** Existing product when editing; null when creating. */
  product: SemiProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SemiProductFormDialog({ product, onClose, onSaved }: Props) {
  const t = useTranslations('nomenklatura');
  const categories = useNomenclatureStore((s) => s.semiCategories);
  const addSemiProduct = useNomenclatureStore((s) => s.addSemiProduct);
  const updateSemiProduct = useNomenclatureStore((s) => s.updateSemiProduct);

  const isEdit = product !== null;

  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [unit, setUnit] = useState(product?.unit ?? '');
  const [outputQty, setOutputQty] = useState(product ? String(product.outputQty) : '');
  const [note, setNote] = useState(product?.note ?? '');
  const [isActive, setIsActive] = useState<boolean>(product?.isActive ?? true);
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
    const trimmed = name.trim();
    if (!trimmed || !categoryId) return;
    const qty = Number.parseFloat(outputQty);
    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    const payload = {
      name: trimmed,
      categoryId,
      unit: unit.trim(),
      outputQty: safeQty,
      note: note.trim(),
      isActive,
    };
    if (isEdit && product) {
      updateSemiProduct(product.id, payload);
      toast.success(t('semi.updated'));
    } else {
      addSemiProduct(payload);
      toast.success(t('semi.created'));
    }
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
        <h2 id={headingId} className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
          {isEdit ? t('semi.edit') : t('semi.add')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label={t('category')}>
            <select
              className={inputClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>
                {t('semi.select_category')}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('unit')}>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                maxLength={16}
                className={inputClass}
              />
            </Field>
            <Field label={t('semi.output_qty')}>
              <input
                type="number"
                min={0}
                step="any"
                value={outputQty}
                onChange={(e) => setOutputQty(e.target.value)}
                className={cn(inputClass, "[font-feature-settings:'tnum']")}
              />
            </Field>
          </div>

          <Field label={t('note')}>
            <textarea
              className={cn(inputClass, 'resize-none')}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={240}
            />
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
              disabled={name.trim().length === 0 || !categoryId}
              className={primaryBtnClass}
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
