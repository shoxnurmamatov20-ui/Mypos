'use client';

import { employeesApi, type Employee } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { EmployeeFormDialog } from './employee-form-dialog';
import { ShiftHistoryDialog } from './shift-history-dialog';

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-mint-100 text-mint-700',
  on_leave: 'bg-gold-100 text-gold-700',
  terminated: 'bg-red-100 text-red-700',
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
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + {t('add_employee')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500">{t('loading')}</div>
      ) : employees.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
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
                className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                    {initials || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setViewingShifts(e)}
                      className="truncate text-left font-semibold text-neutral-900 hover:text-brand-600 hover:underline"
                    >
                      {name}
                    </button>
                    <p className="truncate text-sm text-neutral-500">{e.employee_code}</p>
                    <p className="truncate text-xs text-neutral-400">{e.position.label}</p>
                  </div>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (STATUS_CLASS[e.status.value] ?? 'bg-neutral-100 text-neutral-700')
                    }
                  >
                    {e.status.label}
                  </span>
                </div>

                {isOnShift(e) && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-mint-50 px-3 py-2 text-xs font-medium text-mint-700">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mint-500" />
                    {t('on_shift')}
                  </div>
                )}

                {e.user?.phone && (
                  <p className="mt-3 truncate text-xs text-neutral-500">{e.user.phone}</p>
                )}

                <div className="mt-3 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewingShifts(e)}
                    className="font-medium text-neutral-600 hover:underline"
                  >
                    {t('shifts')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(e)}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(e)}
                    className="font-medium text-danger hover:underline"
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
