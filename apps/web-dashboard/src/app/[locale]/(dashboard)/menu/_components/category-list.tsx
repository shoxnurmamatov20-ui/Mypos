'use client';

import { type MenuCategory, menuApi } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { CategoryFormDialog } from './category-form-dialog';

export function CategoryList({
  categories,
  isLoading,
  onChanged,
}: {
  categories: MenuCategory[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('menu');
  const [editing, setEditing] = useState<MenuCategory | 'new' | null>(null);

  const handleDelete = async (cat: MenuCategory) => {
    if (!confirm(t('confirm_delete_category', { name: cat.name.uz }))) return;
    try {
      await menuApi.categories.delete(apiClient, cat.id);
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
          className="rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white"
        >
          + {t('add_category')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : categories.length === 0 ? (
        <EmptyState label={t('empty_categories')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-5 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {cat.color && (
                    <div
                      className="h-10 w-10 rounded-lg"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <div
                        className="h-full w-full rounded-lg opacity-60"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[#16221f] dark:text-white">{cat.name.uz}</h3>
                    <p className="text-xs text-[#62716d] dark:text-[#94a3b8]">
                      {cat.name.ru} · {cat.name.en}
                    </p>
                  </div>
                </div>
                {!cat.is_active && (
                  <span className="rounded-full bg-[#eef4f3] dark:bg-[#1a2235] px-2 py-0.5 text-xs text-[#62716d] dark:text-[#94a3b8]">
                    {t('inactive')}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-[#62716d] dark:text-[#94a3b8]">
                <span>
                  {cat.items_count ?? 0} {t('items_count_suffix')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(cat)}
                    className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
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
        <CategoryFormDialog
          category={editing === 'new' ? null : editing}
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
      {label}
    </div>
  );
}
