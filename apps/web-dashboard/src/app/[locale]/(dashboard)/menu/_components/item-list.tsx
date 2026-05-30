'use client';

import { menuApi, type MenuCategory, type MenuItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { ItemFormDialog } from './item-form-dialog';

export function ItemList({
  items,
  categories,
  isLoading,
  onChanged,
}: {
  items: MenuItem[];
  categories: MenuCategory[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('menu');
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(t('confirm_delete_item', { name: item.name.uz }))) return;
    try {
      await menuApi.items.delete(apiClient, item.id);
      toast.success(t('deleted'));
      onChanged();
    } catch {
      toast.error(t('delete_failed'));
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing('new')}
          disabled={categories.length === 0}
          className="rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          + {t('add_item')}
        </button>
      </div>

      {categories.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-600 dark:text-amber-400">
          {t('need_category_first')}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t('empty_items')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] transition"
            >
              <div
                className="h-32 bg-[#eef4f3] dark:bg-[#1a2235]"
                style={{
                  backgroundImage: item.image_url ? `url(${item.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#16221f] dark:text-white">{item.name.uz}</h3>
                  <div className="flex gap-1">
                    {item.is_new && (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {t('new')}
                      </span>
                    )}
                    {item.has_discount && (
                      <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        -{item.discount_percent}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold text-[#0f766e] dark:text-teal-400">
                  {formatUZS(item.price.effective_amount)}
                </p>
                {item.category && (
                  <p className="mt-1 text-xs text-[#62716d] dark:text-[#94a3b8]">{item.category.name.uz}</p>
                )}
                <div className="mt-3 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <ItemFormDialog
          item={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
