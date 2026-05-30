'use client';

import { Building2, Stethoscope, X } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  type Complaint,
  type ComplaintSeverity,
  type ComplaintShowResponse,
  type ComplaintStatus,
  ceoFetch,
  ceoMutate,
} from '@/lib/api';
import { cn } from '@/lib/cn';

type T = ReturnType<typeof useTranslations>;

export function ComplaintDetailDrawer({
  complaintId,
  onClose,
  onSaved,
  statuses,
  severities,
  t,
}: {
  complaintId: number | null;
  onClose: () => void;
  onSaved: () => void;
  statuses: ComplaintStatus[];
  severities: ComplaintSeverity[];
  t: T;
}) {
  const [row, setRow] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ComplaintStatus>('open');
  const [severity, setSeverity] = useState<ComplaintSeverity>('medium');
  const [isUrgent, setIsUrgent] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (complaintId === null) {
      setRow(null);
      setNote('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    ceoFetch<ComplaintShowResponse>(`/api/v1/ceo/complaints/${complaintId}`)
      .then((res) => {
        if (cancelled) return;
        setRow(res.data);
        setStatus(res.data.status);
        setSeverity(res.data.severity);
        setIsUrgent(res.data.is_urgent);
        setNote('');
      })
      .catch(() => {
        if (!cancelled) setError(t('error_load'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [complaintId, t]);

  useEffect(() => {
    if (complaintId === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [complaintId, onClose]);

  if (complaintId === null) return null;

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await ceoMutate<ComplaintShowResponse>(`/api/v1/ceo/complaints/${complaintId}`, 'PATCH', {
        status,
        severity,
        is_urgent: isUrgent,
        resolution_note: note.trim() || null,
      });
      onSaved();
    } catch {
      setError(t('error_save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#0b1120] border-l border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex flex-col"
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(22,34,31,0.07)] dark:border-[rgba(255,255,255,0.06)]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#62716d] dark:text-[#94a3b8]">
              {t('detail_title')}
            </p>
            <h2 className="text-[18px] font-bold text-[#16221f] dark:text-white truncate">
              {row ? `#${row.id}` : '—'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 -mr-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('detail_close')}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-10 rounded-md bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
                />
              ))}
            </div>
          ) : row ? (
            <>
              {/* Clinic + doctor block */}
              <div className="space-y-1.5">
                {row.clinic ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#16221f] dark:text-white">
                    <Building2 className="w-3.5 h-3.5 text-[#62716d] dark:text-[#94a3b8]" />
                    <span className="font-semibold">{row.clinic.name}</span>
                    {row.clinic.region ? (
                      <span className="text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                        · {row.clinic.region}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {row.doctor ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#16221f] dark:text-white">
                    <Stethoscope className="w-3.5 h-3.5 text-[#62716d] dark:text-[#94a3b8]" />
                    <span>{row.doctor.name}</span>
                    {row.doctor.specialty ? (
                      <span className="text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                        · {row.doctor.specialty}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-[#f8fafc] dark:bg-[#111827] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#62716d] dark:text-[#94a3b8] mb-1.5">
                  {t('th_summary')}
                </p>
                <p className="text-[13px] text-[#16221f] dark:text-white whitespace-pre-wrap leading-relaxed">
                  {row.summary ?? '—'}
                </p>
              </div>

              <Meta label={t('th_when')} value={new Date(row.created_at).toLocaleString()} />
              <Meta label={t('th_age')} value={`${row.age_hours} h`} />
              {row.resolved_at ? (
                <Meta
                  label={t('status.resolved')}
                  value={new Date(row.resolved_at).toLocaleString()}
                />
              ) : null}

              {/* Editable fields */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Field label={t('th_status')}>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                    className="h-9 w-full rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] px-2 text-[13px] text-[#16221f] dark:text-white"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('th_severity')}>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
                    className="h-9 w-full rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] px-2 text-[13px] text-[#16221f] dark:text-white"
                  >
                    {severities.map((s) => (
                      <option key={s} value={s}>
                        {t(`severity.${s}`)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <label className="inline-flex items-center gap-2 text-[13px] text-[#16221f] dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                {t('urgent_badge')}
              </label>

              <Field label={t('resolution_note')}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0b1120] px-2.5 py-2 text-[13px] text-[#16221f] dark:text-white resize-none"
                />
              </Field>

              {error ? (
                <div className="rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2.5 text-[12px] text-[#b42318] dark:text-red-300">
                  {error}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">{t('error_load')}</p>
          )}
        </div>

        <footer className="flex items-center gap-2 px-5 py-3 border-t border-[rgba(22,34,31,0.07)] dark:border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-md text-[13px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {t('detail_close')}
          </button>
          <button
            type="button"
            disabled={!row || saving}
            onClick={onSave}
            className={cn(
              'ml-auto h-9 px-4 rounded-md text-[13px] font-bold text-white transition-colors',
              'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-95',
            )}
          >
            {saving ? t('saving') : t('save')}
          </button>
        </footer>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#62716d] dark:text-[#94a3b8] mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-[#62716d] dark:text-[#94a3b8]">{label}</span>
      <span className="font-semibold text-[#16221f] dark:text-white tabular-nums">{value}</span>
    </div>
  );
}
