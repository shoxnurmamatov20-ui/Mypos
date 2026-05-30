'use client';

import { clockApi, shiftsApi, type Employee, type Shift } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const STATUS_CLASS: Record<string, string> = {
  scheduled: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
  open: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  closed: 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#62716d] dark:text-[#94a3b8]',
  missed: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
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
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#16221f] dark:text-white">
              {employee.user?.name ?? employee.employee_code}
            </h2>
            <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">
              {employee.employee_code} · {employee.position.label}
            </p>
          </div>
          <div className="flex gap-2">
            {hasOpen ? (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={busy}
                className="rounded-lg bg-red-600 dark:bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-60"
              >
                {tClock('out')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={busy}
                className="rounded-lg bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
              >
                {tClock('in')}
              </button>
            )}
          </div>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-[#16221f] dark:text-[#e2e8f0]">{t('shift_history')}</h3>
        {shiftsQuery.isLoading ? (
          <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{tShift('loading')}</div>
        ) : shifts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-6 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {tShift('empty')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
            <table className="w-full text-sm">
              <thead className="bg-[#eef4f3] dark:bg-[#1a2235] text-left text-xs uppercase text-[#62716d] dark:text-[#94a3b8]">
                <tr>
                  <th className="px-3 py-2">{tShift('scheduled_start')}</th>
                  <th className="px-3 py-2">{tShift('scheduled_end')}</th>
                  <th className="px-3 py-2">{tShift('actual_start')}</th>
                  <th className="px-3 py-2">{tShift('actual_end')}</th>
                  <th className="px-3 py-2">{tShift('status_col')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-[#16221f] dark:text-[#e2e8f0]">{formatDate(s.scheduled_start)}</td>
                    <td className="px-3 py-2 text-[#16221f] dark:text-[#e2e8f0]">{formatDate(s.scheduled_end)}</td>
                    <td className="px-3 py-2 text-[#62716d] dark:text-[#94a3b8]">{formatDate(s.actual_start)}</td>
                    <td className="px-3 py-2 text-[#62716d] dark:text-[#94a3b8]">{formatDate(s.actual_end)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-medium ' +
                          (STATUS_CLASS[s.status.value] ?? 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#16221f] dark:text-[#e2e8f0]')
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

        <div className="mt-4 flex justify-end border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-4 py-2 text-sm font-medium text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
