'use client';

import { ApiError, type Department, departmentsApi } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export function DepartmentFormDialog({
  department,
  onClose,
  onSaved,
}: {
  department: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('departments');
  const isEdit = department !== null;

  const [name, setName] = useState(department?.name ?? '');
  const [description, setDescription] = useState(department?.description ?? '');
  const [sortOrder, setSortOrder] = useState<number>(department?.sort_order ?? 0);
  const [isActive, setIsActive] = useState<boolean>(department?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit && department) {
        await departmentsApi.update(apiClient, department.id, {
          name,
          description: description || null,
          sort_order: sortOrder,
          is_active: isActive,
        });
        toast.success(t('updated'));
      } else {
        await departmentsApi.create(apiClient, {
          name,
          description: description || null,
          sort_order: sortOrder,
          is_active: isActive,
        });
        toast.success(t('created'));
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as
          | { message?: string; errors?: Record<string, string[]> }
          | undefined;
        const firstErr = body?.errors ? (Object.values(body.errors)[0]?.[0] ?? null) : null;
        toast.error(firstErr ?? body?.message ?? t('save_failed'));
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
          {isEdit ? t('edit_department') : t('add_department')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('fields.name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={128}
              placeholder={t('fields.name_placeholder')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </Field>
          <Field label={t('fields.description')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={512}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('fields.sort_order')}>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                min={0}
                max={9999}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </Field>
            <Field label={t('fields.is_active')}>
              <label className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">
                  {isActive ? t('status.active') : t('status.inactive')}
                </span>
              </label>
            </Field>
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
