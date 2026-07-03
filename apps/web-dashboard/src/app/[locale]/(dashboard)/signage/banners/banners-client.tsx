'use client';

import { cn } from '@mypos/ui';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type Banner,
  type BannerType,
  useSignageHydrated,
  useSignageStore,
} from '@/stores/signage';
import {
  inputClass,
  primaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
  Toggle,
} from '../../settings/_components/settings-ui';
import { BannerFormDialog } from './banner-form-dialog';

const TYPE_BADGE: Record<BannerType, string> = {
  promo: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  discount: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  new: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
};

export function BannersClient() {
  const hydrated = useSignageHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <BannersInner />;
}

type DialogState = Banner | 'new' | null;

function BannersInner() {
  const t = useTranslations('signage');
  const banners = useSignageStore((s) => s.banners);
  const deleteBanner = useSignageStore((s) => s.deleteBanner);
  const updateBanner = useSignageStore((s) => s.updateBanner);

  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);

  const typeLabel = (ty: BannerType) =>
    ty === 'promo'
      ? t('banners.type_promo')
      : ty === 'discount'
        ? t('banners.type_discount')
        : t('banners.type_new');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return banners;
    return banners.filter(
      (b) => b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
    );
  }, [banners, search]);

  const editing: Banner | null = dialog !== null && dialog !== 'new' ? dialog : null;

  function handleDelete(b: Banner) {
    if (!confirm(t('confirm_delete'))) return;
    deleteBanner(b.id);
    toast.success(t('banners.deleted'));
  }

  function periodText(b: Banner): string {
    if (!b.startDate && !b.endDate) return t('banners.no_dates');
    return `${b.startDate || '…'} → ${b.endDate || '…'}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          className={cn(inputClass, 'w-auto min-w-[200px] flex-1')}
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search_placeholder')}
        />
        <button
          type="button"
          className={cn(primaryBtnClass, 'inline-flex items-center gap-1.5')}
          onClick={() => setDialog('new')}
        >
          <Plus className="h-4 w-4" /> {t('banners.add')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <SettingsCard>
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('banners.empty')}
          </p>
        </SettingsCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-[rgba(22,34,31,0.09)] bg-white transition-shadow hover:shadow-[0_2px_12px_rgba(18,34,31,0.08)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]',
                !b.isActive && 'opacity-60',
              )}
            >
              {/* Preview tile */}
              <div
                className="relative flex h-28 items-end bg-cover bg-center p-3"
                style={
                  b.imageUrl
                    ? { backgroundImage: `url("${b.imageUrl}")` }
                    : { backgroundColor: b.color }
                }
              >
                <span
                  className={cn(
                    'absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    TYPE_BADGE[b.type],
                  )}
                >
                  {typeLabel(b.type)}
                </span>
                <p className="line-clamp-2 text-sm font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                  {b.title}
                </p>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                {b.description && (
                  <p className="line-clamp-2 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
                    {b.description}
                  </p>
                )}
                <p className="text-[12px] text-[#62716d] [font-feature-settings:'tnum'] dark:text-[#94a3b8]">
                  {periodText(b)}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <Toggle
                    checked={b.isActive}
                    onChange={(v) => updateBanner(b.id, { isActive: v })}
                    ariaLabel={t('active')}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDialog(b)}
                      className="rounded-lg p-2 text-[#62716d] transition-colors hover:bg-[#eef4f3] hover:text-[#0f766e] active:scale-95 dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
                      aria-label={t('edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="rounded-lg p-2 text-[#62716d] transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:text-[#94a3b8] dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog !== null && (
        <BannerFormDialog
          banner={editing}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      )}
    </div>
  );
}
