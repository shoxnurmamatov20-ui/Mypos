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
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
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
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2 focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 dark:focus:ring-teal-500/20"
            />
          </Field>
          <Field label={t('name_ru')}>
            <input
              type="text"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2 focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 dark:focus:ring-teal-500/20"
            />
          </Field>
          <Field label={t('name_en')}>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              maxLength={128}
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2 focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 dark:focus:ring-teal-500/20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('color')}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]"
              />
            </Field>
            <Field label={t('icon')}>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={64}
                placeholder="utensils"
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
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
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
            />
          </Field>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[#0f766e] dark:text-teal-400 focus:ring-[#0f766e]/50 dark:focus:ring-teal-500/50"
            />
            <span className="text-sm text-[#16221f] dark:text-[#e2e8f0]">{t('is_active')}</span>
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
      <span className="mb-1 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">{label}</span>
      {children}
    </label>
  );
}
