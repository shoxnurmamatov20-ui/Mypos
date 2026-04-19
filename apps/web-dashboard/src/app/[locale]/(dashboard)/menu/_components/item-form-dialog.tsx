'use client';

import {
  ApiError,
  menuApi,
  type MenuCategory,
  type MenuItem,
} from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export function ItemFormDialog({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('menu');
  const isEdit = item !== null;

  const [categoryId, setCategoryId] = useState(item?.category_id ?? categories[0]?.id ?? '');
  const [nameUz, setNameUz] = useState(item?.name.uz ?? '');
  const [nameRu, setNameRu] = useState(item?.name.ru ?? '');
  const [nameEn, setNameEn] = useState(item?.name.en ?? '');
  const [descUz, setDescUz] = useState(item?.description?.uz ?? '');
  const [price, setPrice] = useState(item?.price.amount ?? 0);
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');
  const [isNew, setIsNew] = useState(item?.is_new ?? false);
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false);
  const [hasDiscount, setHasDiscount] = useState(item?.has_discount ?? false);
  const [discountPercent, setDiscountPercent] = useState(item?.discount_percent ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error(t('need_category_first'));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        category_id: categoryId,
        name: { uz: nameUz, ru: nameRu, en: nameEn },
        description: descUz ? { uz: descUz, ru: descUz, en: descUz } : null,
        price_amount: price,
        price_currency: 'UZS',
        image_url: imageUrl || null,
        is_new: isNew,
        is_featured: isFeatured,
        has_discount: hasDiscount,
        discount_percent: hasDiscount ? discountPercent : null,
      };
      if (isEdit && item) {
        await menuApi.items.update(apiClient, item.id, payload);
        toast.success(t('updated'));
      } else {
        await menuApi.items.create(apiClient, payload);
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">
          {isEdit ? t('edit_item') : t('add_item')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('category')}>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.uz}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="UZ">
              <input type="text" value={nameUz} onChange={(e) => setNameUz(e.target.value)}
                required maxLength={128}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label="RU">
              <input type="text" value={nameRu} onChange={(e) => setNameRu(e.target.value)}
                required maxLength={128}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label="EN">
              <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                required maxLength={128}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
          </div>
          <Field label={t('description_uz')}>
            <textarea value={descUz} onChange={(e) => setDescUz(e.target.value)}
              rows={2} maxLength={2000}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('price_uzs')}>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                required min={0} step={100}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label={t('image_url')}>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                maxLength={512} placeholder="https://..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)}
                className="h-4 w-4 rounded text-brand-500" />
              <span className="text-sm">{t('is_new')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded text-brand-500" />
              <span className="text-sm">{t('is_featured')}</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)}
                className="h-4 w-4 rounded text-brand-500" />
              <span className="text-sm">{t('has_discount')}</span>
            </label>
            {hasDiscount && (
              <input type="number" value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                min={0} max={100} placeholder="%"
                className="mt-2 w-32 rounded-lg border border-neutral-300 px-3 py-2" />
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              {t('cancel')}
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
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
