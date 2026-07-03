'use client';

import { type Table, type TableCategory, type TableStatus, tablesApi } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { TableFormDialog } from './table-form-dialog';

const STATUS_VALUES: TableStatus[] = ['available', 'occupied', 'reserved', 'disabled'];

const STATUS_BADGE_CLASS: Record<TableStatus, string> = {
  available: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  occupied: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
  reserved: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  disabled: 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#62716d] dark:text-[#94a3b8]',
};

export function TableList({
  tables,
  categories,
  isLoading,
  onChanged,
}: {
  tables: Table[];
  categories: TableCategory[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('tables');
  const [editing, setEditing] = useState<Table | 'new' | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleDelete = async (table: Table) => {
    if (!confirm(t('confirm_delete', { name: table.name }))) return;
    try {
      await tablesApi.tables.delete(apiClient, table.id);
      toast.success(t('deleted'));
      onChanged();
    } catch {
      toast.error(t('delete_failed'));
    }
  };

  const handleStatusChange = async (table: Table, status: TableStatus) => {
    if (status === table.status) return;
    setUpdatingId(table.id);
    try {
      await tablesApi.tables.updateStatus(apiClient, table.id, { status });
      toast.success(t('updated'));
      onChanged();
    } catch {
      toast.error(t('save_failed'));
    } finally {
      setUpdatingId(null);
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
          + {t('add_table')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : tables.length === 0 ? (
        <EmptyState label={t('empty_tables')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 transition hover:border-[rgba(22,34,31,0.18)] dark:hover:border-[rgba(255,255,255,0.14)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#16221f] dark:text-white">{table.name}</h3>
                    {table.qr_code && (
                      <span
                        title="QR"
                        aria-label="QR"
                        className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#eef4f3] dark:bg-[#1a2235] text-[10px] font-bold text-[#16221f] dark:text-[#e2e8f0]"
                      >
                        QR
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#62716d] dark:text-[#94a3b8]">
                    {t('capacity')}: {table.capacity}
                    {table.category ? ` · ${table.category.name.uz}` : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    STATUS_BADGE_CLASS[table.status],
                  )}
                >
                  {t(`status.${table.status}`)}
                </span>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-[#62716d] dark:text-[#94a3b8]">
                  {t('change_status')}
                </label>
                <select
                  value={table.status}
                  disabled={updatingId === table.id}
                  onChange={(e) => handleStatusChange(table, e.target.value as TableStatus)}
                  className="mt-1 w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#1a2235] px-2 py-1 text-sm text-[#16221f] dark:text-white disabled:opacity-60"
                >
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setEditing(table)}
                  className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                >
                  {t('edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(table)}
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
        <TableFormDialog
          table={editing === 'new' ? null : editing}
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
      {label}
    </div>
  );
}
