'use client';

import {
  ApiError,
  tablesApi,
  type Table,
  type TableCategory,
  type TableShape,
  type TableStatus,
} from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const STATUS_VALUES: TableStatus[] = ['available', 'occupied', 'reserved', 'disabled'];
const SHAPE_VALUES: TableShape[] = ['round', 'square', 'rectangle', 'oval'];

export function TableFormDialog({
  table,
  categories,
  onClose,
  onSaved,
}: {
  table: Table | null;
  categories: TableCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('tables');
  const isEdit = table !== null;

  const [name, setName] = useState(table?.name ?? '');
  const [capacity, setCapacity] = useState(table?.capacity ?? 4);
  const [categoryId, setCategoryId] = useState<string>(table?.category_id ?? '');
  const [status, setStatus] = useState<TableStatus>(table?.status ?? 'available');
  const [shape, setShape] = useState<TableShape>(table?.shape ?? 'round');
  const [positionX, setPositionX] = useState<string>(
    table?.position_x !== null && table?.position_x !== undefined
      ? String(table.position_x)
      : '',
  );
  const [positionY, setPositionY] = useState<string>(
    table?.position_y !== null && table?.position_y !== undefined
      ? String(table.position_y)
      : '',
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        category_id: categoryId || null,
        name,
        capacity,
        status,
        shape,
        position_x: positionX === '' ? null : Number(positionX),
        position_y: positionY === '' ? null : Number(positionY),
      };
      if (isEdit && table) {
        await tablesApi.tables.update(apiClient, table.id, payload);
        toast.success(t('updated'));
      } else {
        await tablesApi.tables.create(apiClient, payload);
        toast.success(t('created'));
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        toast.error(body?.message ?? t('save_failed'));
      } else {
        toast.error(t('save_failed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">
          {isEdit ? t('edit_table') : t('add_table')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('fields.name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
              placeholder="Stol 1"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('fields.capacity')}>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
                min={1}
                max={50}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </Field>
            <Field label={t('fields.category')}>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">{t('no_category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.uz}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('fields.status')}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TableStatus)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('fields.shape')}>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as TableShape)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                {SHAPE_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {t(`shapes.${s}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              {t('fields.position')}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={positionX}
                onChange={(e) => setPositionX(e.target.value)}
                min={0}
                max={2000}
                placeholder="X"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              <input
                type="number"
                value={positionY}
                onChange={(e) => setPositionY(e.target.value)}
                min={0}
                max={2000}
                placeholder="Y"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
