'use client';

import { type UnitOfMeasure, type UnitType, unitsApi } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { UnitFormDialog } from './unit-form-dialog';

const TYPE_CLASS: Record<UnitType, string> = {
  weight: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  volume: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
  count: 'bg-teal-50 dark:bg-teal-950/50 text-[#0f766e] dark:text-teal-400',
  length: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
};

export function UnitsList({
  units,
  isLoading,
  onChanged,
}: {
  units: UnitOfMeasure[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('units');
  const [editing, setEditing] = useState<UnitOfMeasure | 'new' | null>(null);

  const handleDelete = async (u: UnitOfMeasure) => {
    if (!confirm(t('confirm_delete', { name: u.name }))) return;
    try {
      await unitsApi.delete(apiClient, u.id);
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
          + {t('add_unit')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {units.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 transition"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 font-semibold text-[#0f766e] dark:text-teal-400 [font-feature-settings:'tnum']">
                  {u.abbreviation}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-[#16221f] dark:text-white">
                    {u.name}
                  </h3>
                  <p className="truncate text-sm text-[#62716d] dark:text-[#94a3b8]">
                    {u.abbreviation}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASS[u.type]}`}
                >
                  {t(`type_${u.type}`)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#eef4f3] dark:bg-[#1a2235] px-3 py-2 text-xs">
                <span className="text-[#62716d] dark:text-[#94a3b8]">{t('sort_order')}</span>
                <span className="font-semibold text-[#16221f] dark:text-[#e2e8f0] [font-feature-settings:'tnum']">
                  {u.sort_order}
                </span>
              </div>

              {!u.is_active && (
                <div className="mt-3">
                  <span className="rounded-full bg-[#eef4f3] dark:bg-[#1a2235] px-2 py-0.5 text-xs text-[#62716d] dark:text-[#94a3b8]">
                    {t('is_active')}: —
                  </span>
                </div>
              )}

              <div className="mt-3 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setEditing(u)}
                  className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                >
                  {t('edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(u)}
                  className="font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <UnitFormDialog
          unit={editing === 'new' ? null : editing}
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
