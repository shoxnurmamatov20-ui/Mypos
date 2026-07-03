'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  type ApiError,
  type Clinic,
  type ClinicsResponse,
  ceoFetch,
  ceoMutate,
  type DoctorListItem,
  type DoctorsListResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';
import { DoctorFormDialog } from './DoctorFormDialog';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type Filters = {
  q: string;
  clinic_id: number | '';
  is_active: '' | '1' | '0';
};

const INITIAL_FILTERS: Filters = { q: '', clinic_id: '', is_active: '' };

export function DoctorsClient({ locale }: { locale: string }) {
  const t = useTranslations('doctors');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [data, setData] = useState<DoctorsListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [editing, setEditing] = useState<DoctorListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set('q', filters.q);
    if (filters.clinic_id !== '') sp.set('clinic_id', String(filters.clinic_id));
    if (filters.is_active !== '') sp.set('is_active', filters.is_active);
    sp.set('per_page', '50');
    return sp.toString();
  }, [filters]);

  const load = useCallback(() => {
    setLoading(true);
    ceoFetch<DoctorsListResponse>(`/api/v1/ceo/doctors?${queryString}`)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((e) => {
        const status = (e as ApiError).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setError(String(e));
      })
      .finally(() => setLoading(false));
  }, [queryString, locale]);

  // Initial clinic list (for the filter dropdown + form clinic picker)
  useEffect(() => {
    let cancelled = false;
    ceoFetch<ClinicsResponse>('/api/v1/ceo/clinics')
      .then((res) => {
        if (!cancelled) setClinics(res.data);
      })
      .catch(() => {
        /* clinics filter is optional; ignore failures */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (doctor: DoctorListItem) => {
    if (!confirm(t('confirm_delete', { name: doctor.name }))) return;
    setBusyId(doctor.id);
    try {
      await ceoMutate(`/api/v1/ceo/doctors/${doctor.id}`, 'DELETE');
      load();
    } catch (e) {
      const body = (e as ApiError).body as { message?: string } | null;
      alert(body?.message ?? t('error_delete'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (doctor: DoctorListItem) => {
    setBusyId(doctor.id);
    try {
      await ceoMutate(`/api/v1/ceo/doctors/${doctor.id}`, 'PATCH', {
        is_active: !doctor.is_active,
      });
      load();
    } catch (e) {
      const body = (e as ApiError).body as { message?: string } | null;
      alert(body?.message ?? t('error_toggle'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3.5">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={cn(
              'inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-semibold transition-colors active:scale-95',
              'bg-emerald-600 text-white hover:bg-emerald-700',
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t('add')}
          </button>
        }
      />

      {data?.summary ? <SummaryRow summary={data.summary} t={t} /> : null}

      <FiltersBar
        clinics={clinics}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        t={t}
      />

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
          {error}
        </div>
      ) : null}

      <Card>
        <DoctorsTable
          loading={loading}
          rows={data?.data ?? []}
          t={t}
          busyId={busyId}
          onEdit={setEditing}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </Card>

      {creating ? (
        <DoctorFormDialog
          clinics={clinics}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      ) : null}

      {editing ? (
        <DoctorFormDialog
          clinics={clinics}
          doctor={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function SummaryRow({
  summary,
  t,
}: {
  summary: DoctorsListResponse['summary'];
  t: ReturnType<typeof useTranslations>;
}) {
  const cells = [
    {
      label: t('stat_total'),
      value: summary.total,
      icon: Users,
      accent: 'bg-blue-50 text-blue-700',
    },
    {
      label: t('stat_active'),
      value: summary.active,
      icon: CheckCircle2,
      accent: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: t('stat_inactive'),
      value: summary.inactive,
      icon: XCircle,
      accent: 'bg-gray-100 text-gray-700',
    },
    {
      label: t('stat_clinics'),
      value: summary.clinics_count,
      icon: Stethoscope,
      accent: 'bg-indigo-50 text-indigo-700',
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-3.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
              {c.label}
            </p>
            <span
              className={cn('inline-flex h-6 w-6 items-center justify-center rounded-md', c.accent)}
            >
              <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
          </div>
          <p className="mt-2 text-[24px] font-black tabular-nums text-[#16221f] dark:text-white leading-none">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function FiltersBar({
  clinics,
  filters,
  onChange,
  onReset,
  t,
}: {
  clinics: Clinic[];
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#62716d] dark:text-[#94a3b8]" />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder={t('search_placeholder')}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1120] text-[13px] text-[#16221f] dark:text-white placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>
      <select
        value={filters.clinic_id}
        onChange={(e) =>
          onChange({
            ...filters,
            clinic_id: e.target.value === '' ? '' : Number(e.target.value),
          })
        }
        className="h-9 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1120] text-[13px] text-[#16221f] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <option value="">{t('filter_all_clinics')}</option>
        {clinics.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={filters.is_active}
        onChange={(e) =>
          onChange({ ...filters, is_active: e.target.value as Filters['is_active'] })
        }
        className="h-9 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1120] text-[13px] text-[#16221f] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <option value="">{t('filter_status_any')}</option>
        <option value="1">{t('active')}</option>
        <option value="0">{t('inactive')}</option>
      </select>
      <button
        type="button"
        onClick={onReset}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1120] text-[13px] font-semibold text-[#16221f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-colors"
      >
        {t('reset')}
      </button>
    </div>
  );
}

function DoctorsTable({
  loading,
  rows,
  t,
  busyId,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  loading: boolean;
  rows: DoctorListItem[];
  t: ReturnType<typeof useTranslations>;
  busyId: number | null;
  onEdit: (d: DoctorListItem) => void;
  onDelete: (d: DoctorListItem) => void;
  onToggleActive: (d: DoctorListItem) => void;
}) {
  if (loading && rows.length === 0) {
    return (
      <div className="p-6 space-y-2.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-12 rounded-md bg-[#f8fafc] dark:bg-[#1a2235] animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#62716d] dark:text-[#94a3b8]">
        <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <p className="text-[13px]">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]">
            <th className="text-left pl-4 pr-3 py-3 font-bold">{t('col_name')}</th>
            <th className="text-left px-3 py-3 font-bold">{t('col_specialty')}</th>
            <th className="text-left px-3 py-3 font-bold">{t('col_clinic')}</th>
            <th className="text-right px-3 py-3 font-bold tabular-nums">{t('col_rating')}</th>
            <th className="text-right px-3 py-3 font-bold tabular-nums">{t('col_feedback')}</th>
            <th className="text-right px-3 py-3 font-bold tabular-nums">{t('col_complaints')}</th>
            <th className="text-center px-3 py-3 font-bold">{t('col_status')}</th>
            <th className="text-right pr-4 pl-3 py-3 font-bold">{t('col_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr
              key={d.id}
              className="border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)] hover:bg-[#f8fafc] dark:hover:bg-[#1a2235]/40"
            >
              <td className="pl-4 pr-3 py-3">
                <div className="font-semibold text-[#16221f] dark:text-white">{d.name}</div>
                {d.department ? (
                  <div className="text-[11px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
                    {d.department.name}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-3 text-[#62716d] dark:text-[#94a3b8]">{d.specialty ?? '—'}</td>
              <td className="px-3 py-3 text-[#16221f] dark:text-white">
                {d.clinic?.name ?? '—'}
                {d.clinic?.region ? (
                  <div className="text-[11px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
                    {d.clinic.region}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-[#16221f] dark:text-white">
                {d.avg_rating !== null ? d.avg_rating.toFixed(1) : '—'}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                {d.feedback_count}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                <span
                  className={cn(
                    d.open_complaints > 0
                      ? 'text-[#b42318] dark:text-red-300 font-semibold'
                      : 'text-[#62716d] dark:text-[#94a3b8]',
                  )}
                >
                  {d.open_complaints}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <StatusBadge status={d.status} reason={d.reason} t={t} />
                {!d.is_active ? (
                  <div className="mt-1">
                    <Badge variant="secondary">{t('inactive')}</Badge>
                  </div>
                ) : null}
              </td>
              <td className="pr-4 pl-3 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleActive(d)}
                    disabled={busyId === d.id}
                    className={cn(
                      'inline-flex h-7 px-2 items-center gap-1 rounded-md text-[11px] font-semibold transition-colors active:scale-95',
                      d.is_active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
                      busyId === d.id && 'opacity-50 cursor-wait',
                    )}
                    title={d.is_active ? t('deactivate') : t('activate')}
                  >
                    {d.is_active ? t('deactivate') : t('activate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(d)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#62716d] hover:bg-gray-100 hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:bg-gray-800 dark:hover:text-white active:scale-95 transition-colors"
                    title={t('edit')}
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(d)}
                    disabled={busyId === d.id}
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-md text-[#b42318] hover:bg-red-50 active:scale-95 transition-colors',
                      busyId === d.id && 'opacity-50 cursor-wait',
                    )}
                    title={t('delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({
  status,
  reason,
  t,
}: {
  status: DoctorListItem['status'];
  reason: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const tone =
    status === 'kritik'
      ? 'bg-red-100 text-red-700'
      : status === 'diqqat'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700';
  const Icon = status === 'soglom' ? CheckCircle2 : AlertTriangle;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-bold',
        tone,
      )}
      title={reason ?? undefined}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {t(`status_${status}`)}
    </span>
  );
}
