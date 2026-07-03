'use client';

import { AlertTriangle, ChevronRight, Flame } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { Complaint, ComplaintStatus } from '@/lib/api';
import { cn } from '@/lib/cn';

type T = ReturnType<typeof useTranslations>;

const SEVERITY_TONE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
};

const STATUS_TONE: Record<string, string> = {
  open: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  in_review: 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
  resolved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  escalated: 'bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
};

export function ComplaintsTable({
  rows,
  loading,
  selected,
  allOnPageSelected,
  onToggleRow,
  onToggleAll,
  onOpenDetail,
  onInlineStatus,
  statuses,
  t,
}: {
  rows: Complaint[];
  loading: boolean;
  selected: Set<number>;
  allOnPageSelected: boolean;
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  onOpenDetail: (id: number) => void;
  onInlineStatus: (id: number, status: ComplaintStatus) => void;
  statuses: ComplaintStatus[];
  t: T;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="h-12 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] border-b border-[rgba(22,34,31,0.07)] dark:border-[rgba(255,255,255,0.06)]">
            <th className="w-8 px-3 py-2.5 text-left">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={onToggleAll}
                aria-label="select-all"
                className="w-3.5 h-3.5 accent-blue-600"
              />
            </th>
            <th className="px-3 py-2.5 text-left">{t('th_id')}</th>
            <th className="px-3 py-2.5 text-left">{t('th_when')}</th>
            <th className="px-3 py-2.5 text-left">{t('th_clinic')}</th>
            <th className="px-3 py-2.5 text-left">{t('th_doctor')}</th>
            <th className="px-3 py-2.5 text-left">{t('th_severity')}</th>
            <th className="px-3 py-2.5 text-left">{t('th_status')}</th>
            <th className="px-3 py-2.5 text-left">{t('th_summary')}</th>
            <th className="px-3 py-2.5 text-right">{t('th_age')}</th>
            <th className="px-3 py-2.5 text-right">{t('th_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const isChecked = selected.has(c.id);
            return (
              <tr
                key={c.id}
                className={cn(
                  'border-b border-[rgba(22,34,31,0.05)] dark:border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30',
                  c.is_stale && 'bg-orange-50/40 dark:bg-orange-950/10',
                )}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleRow(c.id)}
                    aria-label={`select-${c.id}`}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                </td>
                <td className="px-3 py-2.5 font-semibold tabular-nums text-[#16221f] dark:text-white">
                  #{c.id}
                </td>
                <td className="px-3 py-2.5 text-[#62716d] dark:text-[#94a3b8] tabular-nums whitespace-nowrap">
                  {formatDate(c.created_at)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-semibold text-[#16221f] dark:text-white truncate max-w-[180px]">
                    {c.clinic?.name ?? '—'}
                  </div>
                  {c.clinic?.region ? (
                    <div className="text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate max-w-[180px]">
                      {c.clinic.region}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-[#16221f] dark:text-white truncate max-w-[160px]">
                    {c.doctor?.name ?? '—'}
                  </div>
                  {c.doctor?.specialty ? (
                    <div className="text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate max-w-[160px]">
                      {c.doctor.specialty}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      SEVERITY_TONE[c.severity] ?? SEVERITY_TONE.medium,
                    )}
                  >
                    {c.severity === 'urgent' || c.is_urgent ? (
                      <Flame className="w-3 h-3" strokeWidth={2.5} />
                    ) : null}
                    {t(`severity.${c.severity}`)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <select
                    value={c.status}
                    onChange={(e) => onInlineStatus(c.id, e.target.value as ComplaintStatus)}
                    className={cn(
                      'h-7 rounded-full px-2 text-[11px] font-semibold border-0',
                      STATUS_TONE[c.status] ?? STATUS_TONE.open,
                    )}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}`)}
                      </option>
                    ))}
                  </select>
                  {c.is_stale ? (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {t('stale_badge')}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-[#16221f] dark:text-white">
                  <div className="text-[12px] line-clamp-2 max-w-[280px]" title={c.summary ?? ''}>
                    {c.summary ?? '—'}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                  {c.age_hours}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(c.id)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[12px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    {t('details')}
                    <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}
