'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { categoriesByKind, type FinanceKind, useFinanceStore } from '@/stores/finance';
import {
  Field,
  inputClass,
  primaryBtnClass,
  SegmentedControl,
  type SegmentOption,
  secondaryBtnClass,
} from '../../settings/_components/settings-ui';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function OperationFormDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('finance');
  const categories = useFinanceStore((s) => s.categories);
  const addOperation = useFinanceStore((s) => s.addOperation);

  const [kind, setKind] = useState<FinanceKind>('income');
  const [categoryId, setCategoryId] = useState<string>(
    categoriesByKind(categories, 'income')[0]?.id ?? '',
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  const cats = categoriesByKind(categories, kind);

  function changeKind(k: FinanceKind) {
    setKind(k);
    setCategoryId(categoriesByKind(categories, k)[0]?.id ?? '');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0 || !categoryId) return;
    addOperation({ date, kind, categoryId, amount: amt, note: note.trim() });
    toast.success(t('operations.op_created'));
    onSaved();
  }

  const kindOptions: readonly SegmentOption<FinanceKind>[] = [
    { value: 'income', label: t('kind.income') },
    { value: 'expense', label: t('kind.expense') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
          {t('operations.add')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SegmentedControl options={kindOptions} value={kind} onChange={changeKind} />

          <Field label={t('category')}>
            <select
              className={inputClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>
                {t('operations.select_category')}
              </option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('amount')}>
              <input
                type="number"
                min={0}
                step="any"
                className={cn(inputClass, "[font-feature-settings:'tnum']")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field label={t('date')}>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label={t('note')}>
            <textarea
              className={cn(inputClass, 'resize-none')}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('operations.note_placeholder')}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.09)] pt-4 dark:border-[rgba(255,255,255,0.07)]">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              {t('cancel')}
            </button>
            <button type="submit" className={primaryBtnClass}>
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
