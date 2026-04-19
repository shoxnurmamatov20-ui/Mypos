'use client';

import {
  tablesApi,
  type Table,
  type TableCategory,
  type TableStatus,
} from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { TableFormDialog } from './table-form-dialog';

const STATUS_VALUES: TableStatus[] = ['available', 'occupied', 'reserved', 'disabled'];

const STATUS_BADGE_CLASS: Record<TableStatus, string> = {
  available: 'bg-mint-100 text-mint-700',
  occupied: 'bg-rose-100 text-rose-700',
  reserved: 'bg-amber-100 text-amber-700',
  disabled: 'bg-neutral-200 text-neutral-600',
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
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + {t('add_table')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500">{t('loading')}</div>
      ) : tables.length === 0 ? (
        <EmptyState label={t('empty_tables')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">{table.name}</h3>
                    {table.qr_code && (
                      <span
                        title="QR"
                        aria-label="QR"
                        className="inline-flex h-5 w-5 items-center justify-center rounded bg-neutral-100 text-[10px] font-bold text-neutral-700"
                      >
                        QR
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
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
                <label className="block text-xs font-medium text-neutral-500">
                  {t('change_status')}
                </label>
                <select
                  value={table.status}
                  disabled={updatingId === table.id}
                  onChange={(e) =>
                    handleStatusChange(table, e.target.value as TableStatus)
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1 text-sm disabled:opacity-60"
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
                  className="font-medium text-brand-600 hover:underline"
                >
                  {t('edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(table)}
                  className="font-medium text-danger hover:underline"
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
    <div className="rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
      {label}
    </div>
  );
}
