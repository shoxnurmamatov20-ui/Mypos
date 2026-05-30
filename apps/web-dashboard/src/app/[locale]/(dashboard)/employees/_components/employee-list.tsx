'use client';

import { employeesApi, type Employee } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { EmployeeFormDialog } from './employee-form-dialog';
import { ShiftHistoryDialog } from './shift-history-dialog';

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  on_leave: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  terminated: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
};

export function EmployeeList({
  employees,
  isLoading,
  onChanged,
}: {
  employees: Employee[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('employees');
  const [editing, setEditing] = useState<Employee | 'new' | null>(null);
  const [viewingShifts, setViewingShifts] = useState<Employee | null>(null);

  const handleDelete = async (e: Employee) => {
    const name = e.user?.name ?? e.employee_code;
    if (!confirm(t('confirm_delete', { name }))) return;
    try {
      await employeesApi.delete(apiClient, e.id);
      toast.success(t('deleted'));
      onChanged();
    } catch {
      toast.error(t('delete_failed'));
    }
  };

  const isOnShift = (e: Employee): boolean =>
    e.latest_shift?.status.value === 'open';

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white"
        >
          + {t('add_employee')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => {
            const name = e.user?.name ?? e.employee_code;
            const initials = name
              .split(' ')
              .map((part) => part[0] ?? '')
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={e.id}
                className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 transition hover:border-[rgba(22,34,31,0.18)] dark:hover:border-[rgba(255,255,255,0.14)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 font-semibold text-[#0f766e] dark:text-teal-400">
                    {initials || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setViewingShifts(e)}
                      className="truncate text-left font-semibold text-[#16221f] dark:text-white hover:text-[#0f766e] dark:hover:text-teal-400 hover:underline"
                    >
                      {name}
                    </button>
                    <p className="truncate text-sm text-[#62716d] dark:text-[#94a3b8]">{e.employee_code}</p>
                    <p className="truncate text-xs text-[#62716d] dark:text-[#94a3b8]">{e.position.label}</p>
                  </div>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (STATUS_CLASS[e.status.value] ?? 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#16221f] dark:text-[#e2e8f0]')
                    }
                  >
                    {e.status.label}
                  </span>
                </div>

                {isOnShift(e) && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    {t('on_shift')}
                  </div>
                )}

                {e.user?.phone && (
                  <p className="mt-3 truncate text-xs text-[#62716d] dark:text-[#94a3b8]">{e.user.phone}</p>
                )}

                <div className="mt-3 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewingShifts(e)}
                    className="font-medium text-[#62716d] dark:text-[#94a3b8] hover:underline"
                  >
                    {t('shifts')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(e)}
                    className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(e)}
                    className="font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== null && (
        <EmployeeFormDialog
          employee={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}

      {viewingShifts !== null && (
        <ShiftHistoryDialog
          employee={viewingShifts}
          onClose={() => setViewingShifts(null)}
          onChanged={() => {
            onChanged();
          }}
        />
      )}
    </div>
  );
}
