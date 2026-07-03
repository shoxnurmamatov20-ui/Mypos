'use client';

import {
  type CreateIncomingDocumentInput,
  type Ingredient,
  incomingDocumentsApi,
} from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DocDetailModal } from './doc-detail-modal';
import { IngredientSearch } from './ingredient-search';
import { inputClass, labelClass, primaryBtnClass, secondaryBtnClass } from './ui-helpers';
import { WarehouseSelect } from './warehouse-select';

type Row = {
  id: string;
  ingredient: Ingredient | null;
  quantity: string;
  unitPrice: string;
  expiryDate: string;
  batchNumber: string;
};

const blankRow = (): Row => ({
  id: crypto.randomUUID(),
  ingredient: null,
  quantity: '',
  unitPrice: '',
  expiryDate: '',
  batchNumber: '',
});

const today = () => new Date().toISOString().slice(0, 10);

export function IncomingDocumentForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [docDate, setDocDate] = useState<string>(today());
  const [supplierName, setSupplierName] = useState('');
  const [supplierInn, setSupplierInn] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([blankRow()]);

  const total = useMemo(() => {
    return rows.reduce((sum, r) => {
      const q = Number(r.quantity);
      const p = Number(r.unitPrice);
      if (!Number.isFinite(q) || !Number.isFinite(p)) return sum;
      return sum + q * p;
    }, 0);
  }, [rows]);

  const mutation = useMutation({
    mutationFn: (input: CreateIncomingDocumentInput) =>
      incomingDocumentsApi.create(apiClient, input),
    onSuccess: () => {
      toast.success(t('toast.created'));
      void qc.invalidateQueries({ queryKey: ['incoming-documents'] });
      void qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: () => {
      toast.error(t('toast.save_failed'));
    },
  });

  const addRow = () => setRows((r) => [...r, blankRow()]);
  const removeRow = (id: string) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      toast.error(t('form.warehouse_required'));
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

    const payload: CreateIncomingDocumentInput = {
      warehouse_id: warehouseId,
      doc_date: docDate || null,
      supplier_name: supplierName.trim() || null,
      supplier_inn: supplierInn.trim() || null,
      notes: notes.trim() || null,
      items: validItems.map((r) => ({
        ingredient_id: r.ingredient!.id,
        quantity: Number(r.quantity),
        unit_price: r.unitPrice ? Number(r.unitPrice) : 0,
        expiry_date: r.expiryDate || null,
        batch_number: r.batchNumber.trim() || null,
      })),
    };

    mutation.mutate(payload);
  };

  const pickedIds = rows.map((r) => r.ingredient?.id).filter(Boolean) as string[];

  return (
    <DocDetailModal
      title={t('actions.new_incoming')}
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
            form="incoming-form"
            disabled={mutation.isPending}
            className={primaryBtnClass}
          >
            {mutation.isPending ? t('actions.saving') : t('actions.save')}
          </button>
        </>
      }
    >
      <form id="incoming-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t('fields.warehouse')}</label>
            <WarehouseSelect value={warehouseId} onChange={setWarehouseId} />
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
          <div>
            <label className={labelClass}>{t('fields.supplier')}</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className={inputClass}
              placeholder="—"
            />
          </div>
          <div>
            <label className={labelClass}>{t('fields.supplier_inn')}</label>
            <input
              type="text"
              value={supplierInn}
              onChange={(e) => setSupplierInn(e.target.value)}
              className={inputClass}
              placeholder="—"
            />
          </div>
          <div className="sm:col-span-2">
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
                <div className="col-span-12 md:col-span-4">
                  <label className={labelClass}>{idx === 0 ? t('fields.ingredient') : ''}</label>
                  <IngredientSearch
                    value={row.ingredient?.id ?? ''}
                    onChange={(ing) =>
                      updateRow(row.id, {
                        ingredient: ing,
                        unitPrice:
                          ing && row.unitPrice === '' ? String(ing.cost_per_unit) : row.unitPrice,
                      })
                    }
                    excludeIds={pickedIds.filter((id) => id !== row.ingredient?.id)}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className={labelClass}>{idx === 0 ? t('fields.quantity') : ''}</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className={labelClass}>{idx === 0 ? t('fields.unit_price') : ''}</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className={labelClass}>{idx === 0 ? t('fields.expiry_date') : ''}</label>
                  <input
                    type="date"
                    value={row.expiryDate}
                    onChange={(e) => updateRow(row.id, { expiryDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className={labelClass}>{idx === 0 ? t('fields.batch_number') : ''}</label>
                  <input
                    type="text"
                    value={row.batchNumber}
                    onChange={(e) => updateRow(row.id, { batchNumber: e.target.value })}
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

          <div className="mt-3 flex items-center justify-end gap-3 text-sm">
            <span className="text-[#62716d] dark:text-[#94a3b8]">{t('form.total_label')}</span>
            <span className="text-base font-bold tabular-nums text-[#16221f] dark:text-white">
              {formatUZS(total)}
            </span>
          </div>
        </div>
      </form>
    </DocDetailModal>
  );
}
