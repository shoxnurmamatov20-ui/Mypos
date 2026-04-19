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
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          + {t('add_item')}
        </button>
      </div>

      {categories.length === 0 && (
        <div className="mb-4 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning">
          {t('need_category_first')}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-neutral-500">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
          {t('empty_items')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md"
            >
              <div
                className="h-32 bg-neutral-100"
                style={{
                  backgroundImage: item.image_url ? `url(${item.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-900">{item.name.uz}</h3>
                  <div className="flex gap-1">
                    {item.is_new && (
                      <span className="rounded-full bg-mint-100 px-2 py-0.5 text-xs font-medium text-mint-700">
                        {t('new')}
                      </span>
                    )}
                    {item.has_discount && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700">
                        -{item.discount_percent}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold text-brand-600">
                  {formatUZS(item.price.effective_amount)}
                </p>
                {item.category && (
                  <p className="mt-1 text-xs text-neutral-500">{item.category.name.uz}</p>
                )}
                <div className="mt-3 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="font-medium text-danger hover:underline"
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
