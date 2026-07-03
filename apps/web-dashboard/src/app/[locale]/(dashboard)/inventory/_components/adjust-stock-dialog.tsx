'use client';

import { type Ingredient, inventoryApi, type StockMovementReason } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const REASONS: StockMovementReason[] = ['purchase', 'adjust', 'waste', 'transfer'];

export function AdjustStockDialog({
  ingredient,
  onClose,
  onSaved,
}: {
  ingredient: Ingredient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('inventory');
  const [delta, setDelta] = useState<string>('');
  const [reason, setReason] = useState<StockMovementReason>('adjust');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(delta);
    if (!Number.isFinite(value) || value === 0) {
      toast.error(t('adjust_invalid'));
      return;
    }
    setSubmitting(true);
    try {
      await inventoryApi.adjustStock(apiClient, ingredient.id, {
        delta: value,
        reason,
        notes: notes.trim() === '' ? null : notes.trim(),
      });
      toast.success(t('adjusted'));
      onSaved();
    } catch {
      toast.error(t('adjust_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-[#16221f] dark:text-white">
          {t('adjust_title')}
        </h2>
        <p className="mb-4 text-sm text-[#62716d] dark:text-[#94a3b8]">
          {ingredient.name.uz} • {t('current')}: <strong>{ingredient.current_stock}</strong>{' '}
          {ingredient.unit}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('delta')} ({ingredient.unit})
            </label>
            <input
              type="number"
              step="0.001"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder={t('delta_placeholder')}
              autoFocus
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500"
            />
            <p className="mt-1 text-xs text-[#62716d] dark:text-[#94a3b8]">{t('delta_hint')}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('reason')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockMovementReason)}
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`reasons.${r}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('notes')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[rgba(22,34,31,0.09)] px-4 py-2 text-sm font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5e58] disabled:opacity-50 dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
            >
              {submitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
