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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
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
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 dark:focus:ring-teal-500/20"
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
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white"
              />
            </Field>
            <Field label={t('fields.category')}>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white"
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
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white"
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
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white"
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
            <span className="mb-1 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
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
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white"
              />
              <input
                type="number"
                value={positionY}
                onChange={(e) => setPositionY(e.target.value)}
                min={0}
                max={2000}
                placeholder="Y"
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-3 py-2 text-[#16221f] dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-4 py-2 text-sm font-medium text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
      <span className="mb-1 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">{label}</span>
      {children}
    </label>
  );
}
