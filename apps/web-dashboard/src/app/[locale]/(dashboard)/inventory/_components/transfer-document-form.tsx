'use client';

import {
  transferDocumentsApi,
  type CreateTransferDocumentInput,
  type Ingredient,
} from '@mypos/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DocDetailModal } from './doc-detail-modal';
import { IngredientSearch } from './ingredient-search';
import {
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from './ui-helpers';
import { WarehouseSelect } from './warehouse-select';

type Row = {
  id: string;
  ingredient: Ingredient | null;
  quantity: string;
  notes: string;
};

const blankRow = (): Row => ({
  id: crypto.randomUUID(),
  ingredient: null,
  quantity: '',
  notes: '',
});

const today = () => new Date().toISOString().slice(0, 10);

export function TransferDocumentForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const [fromWarehouseId, setFromWarehouseId] = useState<string>('');
  const [toWarehouseId, setToWarehouseId] = useState<string>('');
  const [docDate, setDocDate] = useState<string>(today());
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([blankRow()]);

  const mutation = useMutation({
    mutationFn: (input: CreateTransferDocumentInput) =>
      transferDocumentsApi.create(apiClient, input),
    onSuccess: () => {
      toast.success(t('toast.created'));
      void qc.invalidateQueries({ queryKey: ['transfer-documents'] });
      void qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: () => toast.error(t('toast.save_failed')),
  });

  const addRow = () => setRows((r) => [...r, blankRow()]);
  const removeRow = (id: string) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWarehouseId || !toWarehouseId) {
      toast.error(t('form.warehouse_required'));
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error(t('form.same_warehouse'));
      return;
    }

    const validItems = rows.filter(
      (r) =>
        r.ingredient !== null &&
        r.quantity.trim() !== '' &&
        Number.isFinite(Number(r.quantity)) &&
        Number(r.quantity) > 0,
    );

    if (validItems.length === 0) {
      toast.error(t('form.items_required'));
      return;
    }

    const payload: CreateTransferDocumentInput = {
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      doc_date: docDate || null,
      notes: notes.trim() || null,
      items: validItems.map((r) => ({
        ingredient_id: r.ingredient!.id,
        quantity: Number(r.quantity),
        notes: r.notes.trim() || null,
      })),
    };

    mutation.mutate(payload);
  };

  const pickedIds = rows.map((r) => r.ingredient?.id).filter(Boolean) as string[];

  return (
    <DocDetailModal
      title={t('actions.new_transfer')}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className={secondaryBtnClass}
          >
            {t('actions.cancel')}
          </button>
          <button
            type="submit"
            form="transfer-form"
            disabled={mutation.isPending}
            className={primaryBtnClass}
          >
            {mutation.isPending ? t('actions.saving') : t('actions.save')}
          </button>
        </>
      }
    >
      <form id="transfer-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr_1fr]">
          <div>
            <label className={labelClass}>{t('fields.from_warehouse')}</label>
            <WarehouseSelect value={fromWarehouseId} onChange={setFromWarehouseId} />
          </div>
          <div className="hidden items-end pb-2 sm:flex">
            <ArrowRight className="h-5 w-5 text-[#62716d] dark:text-[#94a3b8]" />
          </div>
          <div>
            <label className={labelClass}>{t('fields.to_warehouse')}</label>
            <WarehouseSelect
              value={toWarehouseId}
              onChange={setToWarehouseId}
              excludeId={fromWarehouseId || undefined}
            />
          </div>
          <div>
            <label className={labelClass}>{t('fields.doc_date')}</label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-4">
            <label className={labelClass}>{t('fields.notes')}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#16221f] dark:text-white">
              {t('form.items_section')}
            </h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f766e] hover:text-[#0d5e58] dark:text-teal-400 dark:hover:text-teal-300"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('actions.add_item')}
            </button>
          </div>

          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-12 items-end gap-2 rounded-lg border border-[rgba(22,34,31,0.06)] bg-[#fafbfa] p-3 dark:border-[rgba(255,255,255,0.05)] dark:bg-[#0d1424]"
              >
                <div className="col-span-12 md:col-span-6">
                  <label className={labelClass}>
                    {idx === 0 ? t('fields.ingredient') : ''}
                  </label>
                  <IngredientSearch
                    value={row.ingredient?.id ?? ''}
                    onChange={(ing) => updateRow(row.id, { ingredient: ing })}
                    excludeIds={pickedIds.filter((id) => id !== row.ingredient?.id)}
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className={labelClass}>
                    {idx === 0 ? t('fields.quantity') : ''}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div className="col-span-4 md:col-span-3">
                  <label className={labelClass}>
                    {idx === 0 ? t('fields.notes') : ''}
                  </label>
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    aria-label={t('actions.remove')}
                    className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </DocDetailModal>
  );
}
