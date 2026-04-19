'use client';

import { ApiError, menuApi, type MenuCategory } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export function CategoryFormDialog({
  category,
  onClose,
  onSaved,
}: {
  category: MenuCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('menu');
  const isEdit = category !== null;

  const [nameUz, setNameUz] = useState(category?.name.uz ?? '');
  const [nameRu, setNameRu] = useState(category?.name.ru ?? '');
  const [nameEn, setNameEn] = useState(category?.name.en ?? '');
  const [color, setColor] = useState(category?.color ?? '#EA7C69');
  const [icon, setIcon] = useState(category?.icon ?? 'utensils');
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: { uz: nameUz, ru: nameRu, en: nameEn },
        color: color || null,
        icon: icon || null,
        sort_order: sortOrder,
        is_active: isActive,
      };
      if (isEdit && category) {
        await menuApi.categories.update(apiClient, category.id, payload);
        toast.success(t('updated'));
      } else {
        await menuApi.categories.create(apiClient, payload);
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
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
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
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </Field>
          <Field label={t('name_ru')}>
            <input
              type="text"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </Field>
          <Field label={t('name_en')}>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('color')}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-300"
              />
            </Field>
            <Field label={t('icon')}>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={64}
                placeholder="utensils"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </Field>
          </div>
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
              className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/50"
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
