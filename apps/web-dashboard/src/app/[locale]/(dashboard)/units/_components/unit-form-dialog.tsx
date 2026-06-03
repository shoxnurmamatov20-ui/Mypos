'use client';

import { ApiError, type UnitOfMeasure, type UnitType, unitsApi } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const UNIT_TYPES: readonly UnitType[] = ['weight', 'volume', 'count', 'length'];

export function UnitFormDialog({
  unit,
  onClose,
  onSaved,
}: {
  unit: UnitOfMeasure | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('units');
  const isEdit = unit !== null;

  const [name, setName] = useState(unit?.name ?? '');
  const [abbreviation, setAbbreviation] = useState(unit?.abbreviation ?? '');
  const [type, setType] = useState<UnitType>(unit?.type ?? 'count');
  const [isActive, setIsActive] = useState<boolean>(unit?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState<string>(String(unit?.sort_order ?? 0));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedSort = Number.parseInt(sortOrder, 10);
      const payload = {
        name: name.trim(),
        abbreviation: abbreviation.trim(),
        type,
        is_active: isActive,
        sort_order: Number.isFinite(parsedSort) ? parsedSort : 0,
      };
      if (isEdit && unit) {
        await unitsApi.update(apiClient, unit.id, payload);
        toast.success(t('updated'));
      } else {
        await unitsApi.create(apiClient, payload);
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
          {isEdit ? t('edit_unit') : t('add_unit')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('name')}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={64}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
            <Field label={t('abbreviation')}>
              <input
                type="text"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                required
                maxLength={16}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('type')}>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as UnitType)}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              >
                {UNIT_TYPES.map((ut) => (
                  <option key={ut} value={ut}>
                    {t(`type_${ut}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('sort_order')}>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min={0}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2 [font-feature-settings:'tnum']"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-[rgba(22,34,31,0.2)] text-[#0f766e] focus:ring-[#0f766e]"
            />
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('is_active')}
            </span>
          </label>
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
      <span className="mb-1 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
        {label}
      </span>
      {children}
    </label>
  );
}
