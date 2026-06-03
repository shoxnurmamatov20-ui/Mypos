'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@mypos/ui';
import { type Banner, type BannerType, useSignageStore } from '@/stores/signage';
import {
  Field,
  Toggle,
  inputClass,
  primaryBtnClass,
  type SegmentOption,
  SegmentedControl,
  secondaryBtnClass,
} from '../../settings/_components/settings-ui';

interface Props {
  /** Existing banner when editing; null when creating. */
  banner: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BannerFormDialog({ banner, onClose, onSaved }: Props) {
  const t = useTranslations('signage');
  const addBanner = useSignageStore((s) => s.addBanner);
  const updateBanner = useSignageStore((s) => s.updateBanner);

  const isEdit = banner !== null;

  const [title, setTitle] = useState(banner?.title ?? '');
  const [description, setDescription] = useState(banner?.description ?? '');
  const [type, setType] = useState<BannerType>(banner?.type ?? 'promo');
  const [color, setColor] = useState(banner?.color ?? '#ea7c69');
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? '');
  const [startDate, setStartDate] = useState(banner?.startDate ?? '');
  const [endDate, setEndDate] = useState(banner?.endDate ?? '');
  const [isActive, setIsActive] = useState<boolean>(banner?.isActive ?? true);
  const headingId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const payload = {
      title: trimmed,
      description: description.trim(),
      type,
      color,
      imageUrl: imageUrl.trim(),
      startDate,
      endDate,
      isActive,
    };
    if (isEdit && banner) {
      updateBanner(banner.id, payload);
      toast.success(t('banners.updated'));
    } else {
      addBanner(payload);
      toast.success(t('banners.created'));
    }
    onSaved();
  }

  const typeOptions: readonly SegmentOption<BannerType>[] = [
    { value: 'promo', label: t('banners.type_promo') },
    { value: 'discount', label: t('banners.type_discount') },
    { value: 'new', label: t('banners.type_new') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={headingId} className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
          {isEdit ? t('banners.edit') : t('banners.add')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('banners.title_label')}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label={t('banners.description')}>
            <textarea
              className={cn(inputClass, 'resize-none')}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={240}
            />
          </Field>

          <SegmentedControl options={typeOptions} value={type} onChange={setType} ariaLabel={t('type')} />

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('banners.color')}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label={t('banners.color')}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[rgba(22,34,31,0.09)] bg-white p-1 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]"
                />
                <span className="font-mono text-xs text-[#62716d] [font-feature-settings:'tnum'] dark:text-[#94a3b8]">
                  {color}
                </span>
              </div>
            </Field>
            <Field label={t('banners.image_url')}>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('banners.start_date')}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t('banners.end_date')}>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">{t('active')}</span>
            <Toggle checked={isActive} onChange={setIsActive} ariaLabel={t('active')} />
          </div>

          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.06)] pt-4 dark:border-[rgba(255,255,255,0.05)]">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              {t('cancel')}
            </button>
            <button type="submit" disabled={title.trim().length === 0} className={primaryBtnClass}>
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
