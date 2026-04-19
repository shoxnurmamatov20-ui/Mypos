'use client';

import {
  ApiError,
  tablesApi,
  type TableCategory,
} from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

type EditingState =
  | { mode: 'new' }
  | { mode: 'edit'; category: TableCategory }
  | null;

export function TableCategoryManager({
  categories,
  isLoading,
  onChanged,
}: {
  categories: TableCategory[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('tables');
  const [editing, setEditing] = useState<EditingState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (cat: TableCategory) => {
    if (!confirm(t('confirm_delete_category', { name: cat.name.uz }))) return;
    setDeletingId(cat.id);
    try {
      await tablesApi.categories.delete(apiClient, cat.id);
      toast.success(t('deleted'));
      onChanged();
    } catch {
      toast.error(t('delete_failed'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          {t('categories_title')}
        </h2>
        <button
          type="button"
          onClick={() => setEditing({ mode: 'new' })}
          className="rounded-md border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
        >
          + {t('add_category')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">{t('loading')}</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('empty_categories')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm"
            >
              <span className="font-medium text-neutral-900">{cat.name.uz}</span>
              <span className="text-xs text-neutral-500">
                ({cat.tables_count ?? 0})
              </span>
              <button
                type="button"
                onClick={() => setEditing({ mode: 'edit', category: cat })}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {t('edit')}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat)}
                disabled={deletingId === cat.id}
                className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
              >
                {t('delete')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <CategoryDialog
          category={editing.mode === 'edit' ? editing.category : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </section>
  );
}

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: TableCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('tables');
  const isEdit = category !== null;
  const [nameUz, setNameUz] = useState(category?.name.uz ?? '');
  const [nameRu, setNameRu] = useState(category?.name.ru ?? '');
  const [nameEn, setNameEn] = useState(category?.name.en ?? '');
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: { uz: nameUz, ru: nameRu, en: nameEn },
        sort_order: sortOrder,
        is_active: isActive,
      };
      if (isEdit && category) {
        await tablesApi.categories.update(apiClient, category.id, payload);
        toast.success(t('updated'));
      } else {
        await tablesApi.categories.create(apiClient, payload);
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
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">
          {isEdit ? t('edit_category') : t('add_category')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('name_uz')}>
            <input
              type="text"
              value={nameUz}
              onChange={(e) => setNameUz(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </Field>
          <Field label={t('name_ru')}>
            <input
              type="text"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </Field>
          <Field label={t('name_en')}>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </Field>
          <Field label={t('sort_order')}>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
              max={10000}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </Field>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-500"
            />
            <span className="text-sm text-neutral-700">{t('is_active')}</span>
          </label>
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
