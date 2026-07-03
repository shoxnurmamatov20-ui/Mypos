'use client';

import { type Department, departmentsApi } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DepartmentFormDialog } from './department-form-dialog';

export function DepartmentList({
  departments,
  isLoading,
  onChanged,
}: {
  departments: Department[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('departments');
  const [editing, setEditing] = useState<Department | 'new' | null>(null);

  const handleDelete = async (d: Department) => {
    if (!confirm(t('confirm_delete', { name: d.name }))) return;
    try {
      await departmentsApi.delete(apiClient, d.id);
      toast.success(t('deleted'));
      onChanged();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t('delete_failed');
      toast.error(message);
    }
  };

  const handleToggleActive = async (d: Department) => {
    try {
      await departmentsApi.update(apiClient, d.id, { is_active: !d.is_active });
      toast.success(d.is_active ? t('deactivated') : t('activated'));
      onChanged();
    } catch {
      toast.error(t('save_failed'));
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
          + {t('add_department')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] dark:bg-[#0b1120] text-left text-xs font-semibold uppercase tracking-wider text-[#62716d] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-3">{t('table.name')}</th>
                <th className="px-4 py-3">{t('table.description')}</th>
                <th className="px-4 py-3 text-right">{t('table.employees')}</th>
                <th className="px-4 py-3 text-right">{t('table.sort_order')}</th>
                <th className="px-4 py-3">{t('table.status')}</th>
                <th className="px-4 py-3 text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-[#f5f8f7] dark:hover:bg-[#0b1120]">
                  <td className="px-4 py-3 font-semibold text-[#16221f] dark:text-white">
                    {d.name}
                  </td>
                  <td className="px-4 py-3 text-[#62716d] dark:text-[#94a3b8]">
                    {d.description ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#16221f] dark:text-white">
                    {d.employees_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {d.sort_order}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (d.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400')
                      }
                    >
                      {d.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(d)}
                        className="font-medium text-[#62716d] dark:text-[#94a3b8] hover:underline"
                      >
                        {d.is_active ? t('deactivate') : t('activate')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(d)}
                        className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
                        className="font-medium text-red-600 dark:text-red-400 hover:underline"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <DepartmentFormDialog
          department={editing === 'new' ? null : editing}
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
