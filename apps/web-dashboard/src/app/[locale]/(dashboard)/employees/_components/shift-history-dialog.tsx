'use client';

import { clockApi, shiftsApi, type Employee, type Shift } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const STATUS_CLASS: Record<string, string> = {
  scheduled: 'bg-sky-100 text-sky-700',
  open: 'bg-mint-100 text-mint-700',
  closed: 'bg-neutral-100 text-neutral-700',
  missed: 'bg-red-100 text-red-700',
};

export function ShiftHistoryDialog({
  employee,
  onClose,
  onChanged,
}: {
  employee: Employee;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations('employees');
  const tShift = useTranslations('shifts');
  const tClock = useTranslations('clock');
  const [busy, setBusy] = useState(false);

  const shiftsQuery = useQuery({
    queryKey: ['shifts', employee.id],
    queryFn: () => shiftsApi.list(apiClient, { employee_id: employee.id, per_page: 30 }),
  });

  const shifts: Shift[] = shiftsQuery.data?.data ?? [];
  const hasOpen = shifts.some((s) => s.status.value === 'open');

  const handleClockIn = async () => {
    setBusy(true);
    try {
      await clockApi.clockIn(apiClient, { employee_id: employee.id, source: 'manual' });
      toast.success(tClock('in_success'));
      await shiftsQuery.refetch();
      onChanged();
    } catch {
      toast.error(tClock('in_failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    setBusy(true);
    try {
      await clockApi.clockOut(apiClient, { employee_id: employee.id, source: 'manual' });
      toast.success(tClock('out_success'));
      await shiftsQuery.refetch();
      onChanged();
    } catch {
      toast.error(tClock('out_failed'));
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso: string | null): string => {
    if (iso === null) return '—';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {employee.user?.name ?? employee.employee_code}
            </h2>
            <p className="text-sm text-neutral-500">
              {employee.employee_code} · {employee.position.label}
            </p>
          </div>
          <div className="flex gap-2">
            {hasOpen ? (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={busy}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {tClock('out')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={busy}
                className="rounded-lg bg-mint-500 px-4 py-2 text-sm font-semibold text-white hover:bg-mint-600 disabled:opacity-60"
              >
                {tClock('in')}
              </button>
            )}
          </div>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-neutral-700">{t('shift_history')}</h3>
        {shiftsQuery.isLoading ? (
          <div className="text-sm text-neutral-500">{tShift('loading')}</div>
        ) : shifts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            {tShift('empty')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">{tShift('scheduled_start')}</th>
                  <th className="px-3 py-2">{tShift('scheduled_end')}</th>
                  <th className="px-3 py-2">{tShift('actual_start')}</th>
                  <th className="px-3 py-2">{tShift('actual_end')}</th>
                  <th className="px-3 py-2">{tShift('status_col')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-neutral-700">{formatDate(s.scheduled_start)}</td>
                    <td className="px-3 py-2 text-neutral-700">{formatDate(s.scheduled_end)}</td>
                    <td className="px-3 py-2 text-neutral-500">{formatDate(s.actual_start)}</td>
                    <td className="px-3 py-2 text-neutral-500">{formatDate(s.actual_end)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-medium ' +
                          (STATUS_CLASS[s.status.value] ?? 'bg-neutral-100 text-neutral-700')
                        }
                      >
                        {s.status.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-end border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
